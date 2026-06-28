/**
 * usbPrinter.ts
 * ---------------------------------------------------------------------------
 * Motor de impressão térmica direta via WebUSB + ZPL.
 *
 * Esta é a adaptação, para o stack React/TypeScript do PAAUV Print Studio,
 * da técnica usada no projeto open-source "L42 PRO" (felipededeus.com/l42pro):
 * em vez de depender do driver do sistema operacional e do diálogo de
 * impressão do navegador (window.print), o navegador fala DIRETO com a
 * impressora via USB, enviando comandos ZPL crus.
 *
 * Diferença chave em relação ao L42 PRO original: lá, a "imagem" a imprimir
 * vinha de um upload (foto/PDF/texto simples) desenhado manualmente num
 * <canvas>. Aqui, a etiqueta já existe como um componente React completo
 * (LabelPreview, com logo, código de barras, QR Code etc.) — então em vez de
 * redesenhar tudo isso em canvas, nós FOTOGRAFAMOS o próprio componente já
 * renderizado (via html-to-image) na resolução exata de pontos da
 * impressora, e só então aplicamos o pipeline de dithering + ZPL.
 * ---------------------------------------------------------------------------
 */

import { toCanvas } from "html-to-image";

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO DE HARDWARE
// ---------------------------------------------------------------------------

/**
 * Resolução nativa da cabeça de impressão térmica, em pontos por milímetro.
 * 203 DPI (a grande maioria das térmicas de etiqueta, incluindo a linha
 * Elgin L42) equivale a 8 dots/mm. Se a sua impressora for 300 DPI, troque
 * este valor para ~11.81.
 *
 * Este número é o mais crítico de todo o pipeline: se ele estiver errado,
 * a etiqueta sai com o tamanho físico errado, mesmo que a configuração de
 * mm esteja correta.
 */
export const DOTS_PER_MM = 8;

/** Limite físico aproximado de área imprimível da maioria dos cabeçotes de 4". */
export const MAX_PRINTABLE_WIDTH_MM = 108;

export interface PrinterSettings {
  /** Intensidade de impressão (densidade térmica), 0-15. */
  darkness: number;
  /** Velocidade de impressão, 1 (lenta) a 3 (rápida). */
  speed: 1 | 2 | 3;
  /** T = Transferência térmica (com ribbon), D = Térmica direta. */
  method: "T" | "D";
  /** W = etiquetas com intervalo (gap), M = marca preta, C = contínuo. */
  media: "W" | "M" | "C";
  /** Número de cópias da mesma etiqueta. */
  copies: number;
}

export const defaultPrinterSettings: PrinterSettings = {
  darkness: 8,
  speed: 3,
  method: "T",
  media: "W",
  copies: 1,
};

export type DitherAlgorithm = "none" | "floyd";

const VENDOR_ID_STORAGE_KEY = "paauv_usb_printer_vendor_id";

// ---------------------------------------------------------------------------
// ESTADO DA CONEXÃO
// ---------------------------------------------------------------------------

let activeDevice: USBDevice | null = null;

export function isPrinterConnected(): boolean {
  return activeDevice !== null;
}

export function isWebUsbSupported(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator;
}

/**
 * Tenta reconectar automaticamente a uma impressora que já tenha recebido
 * permissão do usuário em uma sessão anterior. Deve ser chamada uma vez,
 * ao carregar a aplicação.
 */
export async function tryAutoReconnect(): Promise<boolean> {
  if (!isWebUsbSupported()) return false;

  const devices = await navigator.usb.getDevices();
  if (devices.length === 0) return false;

  try {
    await setupDevice(devices[0]);
    return isPrinterConnected();
  } catch {
    return false;
  }
}

/**
 * Abre o seletor nativo do navegador para o usuário escolher a impressora
 * USB. Precisa ser chamada a partir de um evento de clique do usuário
 * (o navegador bloqueia se for chamada programaticamente sem interação).
 */
export async function requestAndConnectPrinter(): Promise<void> {
  if (!isWebUsbSupported()) {
    throw new Error(
      "Este navegador não suporta WebUSB. Use Google Chrome ou Microsoft Edge em um computador (não funciona em celular nem no Safari/Firefox).",
    );
  }

  const device = await navigator.usb.requestDevice({ filters: [] });
  await setupDevice(device);
}

async function setupDevice(device: USBDevice): Promise<void> {
  activeDevice = null;

  if (!device.opened) {
    await device.open();
  }
  if (device.configuration === null) {
    await device.selectConfiguration(1);
  }

  try {
    await device.claimInterface(0);
  } catch (err) {
    throw new Error(
      "Bloqueio de driver: o Windows está usando o driver oficial da impressora, que impede o acesso direto via USB. Use o utilitário Zadig para trocar o driver do dispositivo para 'WinUSB' e tente novamente.",
    );
  }

  // Handshake: envia um comando ZPL não-imprimível só para confirmar que a
  // comunicação bidirecional está funcionando antes de liberar o botão.
  try {
    await device.transferOut(1, new TextEncoder().encode("^XA^ID^XZ"));
  } catch (err) {
    throw new Error(
      "A impressora foi pareada, mas não respondeu. Verifique o cabo USB e se ela está ligada, depois tente conectar novamente.",
    );
  }

  activeDevice = device;
  localStorage.setItem(VENDOR_ID_STORAGE_KEY, String(device.vendorId));
}

export function disconnectPrinter(): void {
  activeDevice = null;
}

// ---------------------------------------------------------------------------
// CAPTURA: transforma o nó DOM da etiqueta em um bitmap na resolução exata
// que a impressora precisa (1 pixel do canvas capturado = 1 dot físico).
// ---------------------------------------------------------------------------

/**
 * Fator de conversão padrão do navegador entre milímetros e pixels CSS,
 * assumindo 96 CSS-px por polegada (padrão em todo navegador moderno):
 * 96 / 25.4 ≈ 3.7795 px/mm. É nesse tamanho "natural" que o LabelPreview é
 * de fato desenhado em tela, independente da resolução final da impressora.
 */
const CSS_PX_PER_MM = 96 / 25.4;

async function captureNodeAsImageData(
  node: HTMLElement,
  widthDots: number,
  heightDots: number,
): Promise<ImageData> {
  // BUG 1 (causa do branco total): o nó "fonte" fica posicionado em
  // position: fixed; left: -99999px (para não aparecer na tela). O
  // html-to-image clona esse nó e o insere dentro de um <svg><foreignObject>
  // isolado, com seu próprio espaço de coordenadas a partir de zero — e o
  // clone "herda" esse left: -99999px, ficando fora da área visível desse
  // espaço isolado. O resultado é uma foto só do fundo branco.
  //
  // BUG 2 (etiqueta encolhida, viria depois de corrigir o branco): o
  // conteúdo do LabelPreview é todo dimensionado em mm (CSS), enquanto
  // queríamos o resultado em "pixels = dots da impressora" — duas escalas
  // diferentes que não se convertem automaticamente.
  //
  // Correção: neutralizamos position/left/top no clone (resolve o branco) e
  // usamos pixelRatio para escalar a renderização natural (em mm/CSS-px)
  // até a resolução exata exigida pela impressora (resolve o encolhido).
  const naturalWidthPx = node.offsetWidth || widthDots / CSS_PX_PER_MM;
  const pixelRatio = widthDots / naturalWidthPx;

  const canvas = await toCanvas(node, {
    pixelRatio,
    backgroundColor: "#ffffff",
    style: {
      transform: "none",
      position: "static",
      left: "0",
      top: "0",
    },
  });

  // Caso ainda haja diferença de arredondamento entre o canvas capturado e
  // o tamanho exato esperado pela impressora, reamostramos para o tamanho
  // exato em vez de mandar um bitmap de proporção levemente errada ao ZPL.
  let finalCanvas = canvas;
  if (canvas.width !== widthDots || canvas.height !== heightDots) {
    finalCanvas = document.createElement("canvas");
    finalCanvas.width = widthDots;
    finalCanvas.height = heightDots;
    const resizeCtx = finalCanvas.getContext("2d");
    if (!resizeCtx) {
      throw new Error("Não foi possível obter o contexto 2D para reamostragem do canvas.");
    }
    resizeCtx.fillStyle = "#ffffff";
    resizeCtx.fillRect(0, 0, widthDots, heightDots);
    resizeCtx.drawImage(canvas, 0, 0, widthDots, heightDots);
  }

  const ctx = finalCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Não foi possível obter o contexto 2D do canvas de captura.");
  }
  return ctx.getImageData(0, 0, finalCanvas.width, finalCanvas.height);
}

// ---------------------------------------------------------------------------
// DITHERING
// Impressoras térmicas não têm meio-tom: o ponto existe (preto) ou não
// existe (branco). Isso converte a imagem capturada (com antialiasing,
// cores, etc.) em puro preto/branco.
// ---------------------------------------------------------------------------

export function ditherImageData(
  imageData: ImageData,
  algorithm: DitherAlgorithm = "floyd",
): void {
  const data = imageData.data;
  const w = imageData.width;
  const h = imageData.height;

  if (algorithm === "none") {
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const bw = v < 128 ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = bw;
    }
    return;
  }

  // Floyd-Steinberg: difunde o erro de quantização para os vizinhos, dando
  // um resultado bem mais fiel para logos/imagens do que o limiar simples.
  const gray = new Float32Array(w * h);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const oldPixel = gray[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;
      gray[idx] = newPixel;

      const quantError = oldPixel - newPixel;
      if (x + 1 < w) gray[idx + 1] += (quantError * 7) / 16;
      if (x - 1 >= 0 && y + 1 < h) gray[idx - 1 + w] += (quantError * 3) / 16;
      if (y + 1 < h) gray[idx + w] += (quantError * 5) / 16;
      if (x + 1 < w && y + 1 < h) gray[idx + 1 + w] += (quantError * 1) / 16;

      const dataIdx = idx * 4;
      data[dataIdx] = data[dataIdx + 1] = data[dataIdx + 2] = newPixel;
      data[dataIdx + 3] = 255;
    }
  }
}

// ---------------------------------------------------------------------------
// EMPACOTAMENTO: ImageData binarizado -> string hex no formato ^GFA do ZPL
// (1 bit por pixel, 8 pixels por byte, preto = 1).
// ---------------------------------------------------------------------------

interface PackedBitmap {
  hex: string;
  rowBytes: number;
  byteCount: number;
}

function imageDataToZplHex(imageData: ImageData): PackedBitmap {
  const w = imageData.width;
  const h = imageData.height;
  const d = imageData.data;
  const rowBytes = Math.ceil(w / 8);
  let hex = "";

  for (let y = 0; y < h; y++) {
    for (let b = 0; b < rowBytes; b++) {
      let byteValue = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = b * 8 + bit;
        if (x < w) {
          const idx = (y * w + x) * 4;
          if (d[idx] < 128) {
            byteValue |= 1 << (7 - bit);
          }
        }
      }
      hex += byteValue.toString(16).padStart(2, "0").toUpperCase();
    }
  }

  return { hex, rowBytes, byteCount: rowBytes * h };
}

// ---------------------------------------------------------------------------
// MONTAGEM DO COMANDO ZPL
// ---------------------------------------------------------------------------

function buildZpl(
  widthDots: number,
  heightDots: number,
  bitmap: PackedBitmap,
  settings: PrinterSettings,
): string {
  return [
    `^XA~SD${settings.darkness}`,
    `^PW${widthDots}^LL${heightDots}^FWN`,
    `^MT${settings.method}`,
    `^MN${settings.media}`,
    `^PR${settings.speed}`,
    `^FO0,0^GFA,${bitmap.byteCount},${bitmap.byteCount},${bitmap.rowBytes},${bitmap.hex}`,
    `^PQ${settings.copies}`,
    `^XZ`,
  ].join("\n");
}

async function sendRawZpl(zpl: string): Promise<void> {
  if (!activeDevice) {
    throw new Error("Nenhuma impressora conectada via USB.");
  }
  await activeDevice.transferOut(1, new TextEncoder().encode(zpl));
}

/** Envia um comando de calibração do sensor de etiquetas (~JC). */
export async function calibratePrinter(): Promise<void> {
  await sendRawZpl("~JC");
}

/** Envia um comando para cancelar e limpar o buffer de impressão (~JA). */
export async function cancelAllJobs(): Promise<void> {
  await sendRawZpl("~JA");
}

// ---------------------------------------------------------------------------
// FUNÇÃO PRINCIPAL: captura -> dithering -> ZPL -> envio via USB
// ---------------------------------------------------------------------------

export interface PrintLabelOptions {
  /** Elemento DOM contendo exatamente a etiqueta (sem zoom, sem sombra etc.). */
  node: HTMLElement;
  /** Largura total da etiqueta em mm (já considerando todas as colunas). */
  widthMm: number;
  /** Altura da etiqueta em mm. */
  heightMm: number;
  settings?: PrinterSettings;
  ditherAlgorithm?: DitherAlgorithm;
}

export async function printLabelViaUsb({
  node,
  widthMm,
  heightMm,
  settings = defaultPrinterSettings,
  ditherAlgorithm = "floyd",
}: PrintLabelOptions): Promise<void> {
  if (!activeDevice) {
    throw new Error("Conecte a impressora USB antes de imprimir.");
  }

  const widthDots = Math.round(widthMm * DOTS_PER_MM);
  const heightDots = Math.round(heightMm * DOTS_PER_MM);

  const imageData = await captureNodeAsImageData(node, widthDots, heightDots);
  ditherImageData(imageData, ditherAlgorithm);
  const bitmap = imageDataToZplHex(imageData);
  const zpl = buildZpl(widthDots, heightDots, bitmap, settings);

  await sendRawZpl(zpl);
}