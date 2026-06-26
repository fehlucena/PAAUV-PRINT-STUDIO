# Objetivo e Contexto
Construir um sistema completo de ERP/PDV e Gestão de Estoque para um projeto social (Bazar PAUUV), focado em precificação inteligente via Inteligência Artificial (Gemini Vision) para peças de roupas e acessórios doados.

# 1. Design System (Wero Style - Neo Brutalism)
- **Cores Oficiais:** Fundo escuro `bg-[#1D1C1C]`, branco/gelo para as áreas de conteúdo e leitura `bg-[#F4F4F0]`, amarelo destacante `bg-[#FFF48D]`, a cor principal de alerta (Carrot) `#FD9140`, e cinza claro `#D9D9D9`.
- **Tipografia:** Fonte "Impact" (ou sans-serif ultra-bold via Tailwind) para cabeçalhos e rótulos numéricos grandes. Fonte classic serif ou monospace para tabelas e dados técnicos, criando hierarquia.
- **Estilo Visual:** Estilo neo-brutalismo marcante. Bordas pretas espessas em quase tudo (`border-2 border-[#1D1C1C]`), sombras duras ("solid shadows" sem blur, ex: `shadow-[4px_4px_0_#1D1C1C]`) que somem ao passar o mouse (hover effect) e cantos levemente arredondados (`rounded-md`). Interfaces diretas, botões gigantes de blocos únicos, e muita personalidade.

# 2. Estrutura do Frontend (React / Vite / Tailwind)
A build deve possuir uma Sidebar ou um Menu de Abas na base (Mobile First) contendo:
- **`/Dashboard` (Analytics robusto):** Métricas do nível admin da ONG. Usar a biblioteca de gráficos `recharts`. Deve demonstrar: 
  - Valor Financeiro Potencial total (R$).
  - Quantidade total de peças em estoque, com entrada dia a dia (Gráfico de Linha).
  - Distribuição % de Categorias de roupas em estoque (Gráfico de Pizza).
- **`/Scanner` (IA + Pricing):** A tela principal da operação.
  - Acessa a câmera (HTML5 MediaDevices / `<video>`) ou via Upload de arquivo.
  - Envia a imagem em base64 para o modelo **Gemini 3.1 Pro** no backend analisar.
  - A IA extrai e retorna JSON estruturado com: `categoria, tipo, marca, estado_conservacao, analise_visual, e preco_sugerido_referencia_mercado` (se for artigo premium).
  - Um formulário completo logo abaixo da foto para **Edição/Correção manual** dos dados caso a IA tenha errado, contendo um step by step de confirmação.
  - A interface deve exibir na hora o "Preço Sugerido PAUUV" calculando localmente pelas regras de negócio.
  - Input para informar o "Tamanho", seleção de gênero da peça, e um grande botão "Salvar no Estoque".
  - Chave de alternância no topo do form: "Preços Tabela FIxa" ou "Preços Mega Bazar".
- **`/Estoque` (Catálogo Digital):** Lista das roupas ativas. Formato card ou tabela. Foto, Título, Nível (Ex: N5), Tamanho, Marca, e o **Código de Barras visível na tela** gerado via `react-barcode` ou similar.
- **`/Doacoes`**: Menu dedicado para registrar grandes volumes (pesos ou caixas) de descarte e doação pura (que não possuem valor de tabela, não necessitam de fotos, só de peso kg ou volume).
- **`/Exportar`**: Tela com botão "Exportar Tudo para CSV" e "Exportar para JSON", contendo toda a coleção do BD para levar a sistemas antigos de ERP/PDV.

# 3. Base de Dados e Backend
- O sistema precisará armazenar tudo. Deve utilizar **Firebase Firestore** para o banco de dados das Coleções de `pecas_estoque` e `doacoes_historico`.
- Integre o SDK Firebase Web Client. (Configure usando suas skills de BD).
- As requisições ao Gemini devem preferencialmente seguir rotas protegidas se houver chave pública local (Full-stack Express + Vite se achar conveniente ou Next.js).

# 4. O Coração do Sistema: Regras de Avaliação e Preço
A inteligência do pricing processada num arquivo útil `src/lib/pauuvEval.ts` após ler a roupa:

**Tabelas Oficiais:**
- Tabela Fixa Base: `{ N1: 10, N2: 20, N3: 30, N4: 50, N5: 80, N6: 100, N7: 120, N8: 150, N9: 200, N10: 250 }`
- Tabela Mega Bazar: `{ N1: 5, N2: 10, N3: 20, N4: 30, N5: 50, N6: 80, N7: 100, P1: 120, P2: 150 }`

**Categorias PAUUV (CAT1 a CAT9):**
- CAT1: Camisetas/Tops; CAT2: Camisas Blusas Finas; CAT3: Partes Baixo; CAT4: Vestidos/Macacões; CAT5: Casacos/Frio/Jaquetas; CAT6: Alfaiataria Colete/Terno; CAT7: Infantil; CAT8: Calçados esportivos e casuais; CAT9: Acessórios/Bolsas.

**Lógica dos Grupos de Marcas (Importante!):**
1. **Grupo A (Fast Fashion Básico):** Renner, C&A, Marisa, Zara Basic, Shein... (Estas têm "limite/teto", peças dessas não devem extrapolar preços altos nem se novas com tag).
2. **Grupo B (Intermediárias/Esportivas):** Nike, Adidas, Puma, Zara, Lacoste, Osklen, Farm, Calvin Klein, Levi's... (A marca puxa o nível de preço natural do produto pra cima, dando "bônus" de escala).
3. **Grupo C (Luxo/Premium de Grife - Regra dos 35%):** Gucci, Armani, Prada, Louis Vuitton, Coach, Burberry, Air Jordan... (Para peças caríssimas de mercado secundário. O programa bloqueia a avaliação padrão e aciona o campo "RegraPremium35" que pede para o voluntário olhar o valor da web na loja original. O nosso preço no bazar será obrigatoriamente 35% a 40% do que isso custa na OLX ou Mercado Livre, desde que a autenticidade seja declarada).

**Lógica de Estado de Conservação:**
- Nova com Etiqueta = Nível Topo do grupo.
- Boa ou Impecável = Valor Natural da peça.
- Com Pequena Ressalva de uso = Cai nível/Preço baixo.
- Danos Críticos (Mofo, Rasgo, Manchas imensas) = DEVE SER REPROVADA e o preço anulado! Encaminhada pra aba "Doação/Descarte".

# 5. Geração e Imposição de Código de Barras Único (SKU)
Ao cadastrar a peça no banco Firestore, crie um ID dinâmico rastreável no formato:
`C[NUM_CAT]-N[NIVEL_PRECO]-[HASH-CURTA]`.
Exemplo visual e do ID de uma Calça (CAT3) avaliada no Nível 4 e UUID gerado 7A9D: `C3-N4-7A9D`.
Use esse text-string direto no pacote de geração de Código de Barras no catálogo para imprimir a etiqueta.

# Instrução Inicial de Boot à IA Studio
Por favor, construa a shell visual do aplicativo primeiro, o design neo-brutalista global de layout. Integre o Firebase, implemente as funções lógicas no backend e comece entregando Analytics Fake para debug. Uma vez que o Front, Layout, Botões e Banco de Dados rodarem com este estilo solicitado, ative a câmera e integre as requests Gemini estruturadas pra finalizar a leitura em lote de peças. Trabalhe passo a passo documentando suas entregas.
