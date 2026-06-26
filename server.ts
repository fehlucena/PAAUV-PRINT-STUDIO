import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const BASE_PROMPT = `Você é o avaliador de triagem do PAAUV. Avalie uma peça de doação a partir da foto.
Seja muito direto e objetivo. Não descreva detalhes se não for estritamente necessário.

── OBJETIVO ──
Avaliar a peça e sugerir um Nível/Preço seguindo nossa tabela rápida.

── REGRA DE PREÇOS (REFERÊNCIA BAZAR FIXO) ──
Vestuário comum (básicos, blusas, roupas do dia a dia): variam de R$10 (N1) a R$30 (N3). 
Somente ultrapasse R$30 se for peça evidentemente premium.
Calçados/Tênis, Jaquetas, Bolsas boas: variam muito, de R$30, R$50, até R$80+.

SAÍDA OBRIGATÓRIA (JSON estrito APENAS, sem bloco de código markdown):
{"categoria_codigo": "CAT8", "tipo_peca": "Tênis esportivo padrão", "nivel": "N3", "preco": 30, "justificativa": "Aparenta bom estado, sem marca premium visível.", "valor_mercado_pesquisado": null}`;

const SEARCH_PROMPT = `\n\n── BUSCA WEB OBRIGATÓRIA (MODO PREMIUM ATIVADO) ──
A ferramenta de busca no Google foi ativada. VOCÊ DEVE PESQUISAR O VALOR DE MERCADO DA PEÇA se ela for um tênis de marca (Nike, Adidas, etc), chuteira, bolsa cara, ou artigo esportivo.
Retorne o campo "valor_mercado_pesquisado" no JSON para o voluntário (ex: "Valor nas lojas: R$600. Usados: R$350")
e ajuste seu preço / nível para representar cerca de 30 a 35% do valor do produto usado se valer a pena, ignorando os limites padrão e indo até níveis N7, N8, N9 ou N10.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // Initialize official Gemini Client from @google/genai
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Triagem API Endpoint (Proxies the request to Gemini AI securely)
  app.post("/api/triagem", async (req, res) => {
    try {
      const { content, search } = req.body;
      if (!content || !Array.isArray(content)) {
        return res.status(400).json({ error: "Parâmetro 'content' incorreto ou ausente." });
      }

      if (!apiKey) {
        return res.status(400).json({ error: "Chave da API do Gemini não configurada no servidor." });
      }

      const parts: any[] = [];
      for (const part of content) {
        if (part.type === "image" && part.source && part.source.data) {
          parts.push({
            inlineData: {
              data: part.source.data,
              mimeType: part.source.media_type || "image/jpeg"
            }
          });
        } else if (part.type === "text" && part.text) {
          parts.push({
            text: part.text
          });
        }
      }

      const tools: any[] = [];
      if (search) {
        tools.push({ googleSearch: {} });
      }

      console.log(`Iniciando geração de conteúdo no Gemini 2.5 Flash (com busca: ${search})`);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: {
          systemInstruction: search ? BASE_PROMPT + SEARCH_PROMPT : BASE_PROMPT,
          responseMimeType: tools.length > 0 ? undefined : "application/json",
          tools: tools.length > 0 ? tools : undefined,
          temperature: 0.2
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("O modelo Gemini retornou uma resposta vazia.");
      }

      let parsed = null;
      const cleanText = responseText.trim();
      try {
        parsed = JSON.parse(cleanText);
      } catch (err) {
        const startIdx = cleanText.indexOf("{");
        const endIdx = cleanText.lastIndexOf("}");
        if (startIdx >= 0 && endIdx >= 0) {
          parsed = JSON.parse(cleanText.slice(startIdx, endIdx + 1));
        } else {
          throw new Error("Incapaz de fazer o parse da resposta como JSON.");
        }
      }

      return res.json(parsed);
    } catch (error: any) {
      console.error("Erro no processamento da IA:", error);
      let errMsg = error.message || "Erro interno ao chamar a API.";
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        errMsg = "O limite da sua chave Gemini foi atingido. Detalhes: " + errMsg;
      } else if (errMsg.includes("UNAUTHENTICATED") || errMsg.includes("401")) {
        errMsg = "Erro de autenticação da IA. A chave da API do Gemini (GEMINI_API_KEY) informada no servidor parece estar incorreta ou inválida. Por favor, verifique se copiou a chave correta.";
      }
      return res.status(500).json({ error: errMsg });
    }
  });

  // Vite integrated middleware setup for development/production modes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server executando com sucesso na porta ${PORT}`);
  });
}

startServer();
