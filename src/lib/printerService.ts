import html2canvas from "html2canvas";

export interface PrinterStatus {
  connected: boolean;
  isPrinting: boolean;
  statusMessage: string;
  deviceName?: string;
}

export interface PrintOptions {
  quantity: number;
  intensity: number;
  speed: number;
  mediaType: "W" | "M" | "C";
  method: "T" | "D";
  orientation: "N" | "R";
  dithering: boolean;
  widthMm: number;
  heightMm: number;
}

export class PrinterService {
  private device: USBDevice | null = null;
  private isPrinting = false;

  constructor(private onStatusUpdate: (status: PrinterStatus) => void) {}

  private updateStatus(message: string, isPrinting = false) {
    this.isPrinting = isPrinting;
    this.onStatusUpdate({
      connected: !!this.device?.opened,
      isPrinting: this.isPrinting,
      statusMessage: message,
      deviceName: this.device?.productName || "Impressora USB",
    });
  }

  async connect() {
    if (!navigator.usb) {
      throw new Error("WebUSB não suportado neste navegador. Use Chrome ou Edge.");
    }

    try {
      this.updateStatus("Buscando impressora USB...");
      this.device = await navigator.usb.requestDevice({ filters: [] });

      await this.device.open();
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }
      await this.device.claimInterface(0);

      this.updateStatus("Conectado");
      
      navigator.usb.addEventListener("disconnect", (event) => {
        if (event.device === this.device) {
          this.device = null;
          this.updateStatus("Desconectado");
        }
      });

    } catch (err: any) {
      this.updateStatus(`Erro: ${err.message}`);
      throw err;
    }
  }

  async disconnect() {
    if (this.device?.opened) {
      await this.device.close();
    }
    this.device = null;
    this.updateStatus("Desconectado");
  }

  private processImageData(imageData: ImageData, useDithering: boolean): { hex: string; width: number; height: number } {
    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;
    
    const gray = new Float32Array(w * h);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = (data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114);
    }

    if (useDithering) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const oldPixel = gray[idx];
          const newPixel = oldPixel < 128 ? 0 : 255;
          gray[idx] = newPixel;

          const quantError = oldPixel - newPixel;
          if (x + 1 < w) gray[idx + 1] += quantError * 7 / 16;
          if (x - 1 >= 0 && y + 1 < h) gray[idx - 1 + w] += quantError * 3 / 16;
          if (y + 1 < h) gray[idx + w] += quantError * 5 / 16;
          if (x + 1 < w && y + 1 < h) gray[idx + 1 + w] += quantError * 1 / 16;
        }
      }
    } else {
      for (let i = 0; i < gray.length; i++) {
        gray[i] = gray[i] < 128 ? 0 : 255;
      }
    }

    const rowBytes = Math.ceil(w / 8);
    let hexString = "";

    for (let y = 0; y < h; y++) {
      for (let b = 0; b < rowBytes; b++) {
        let byteValue = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = b * 8 + bit;
          if (x < w) {
            const idx = y * w + x;
            if (gray[idx] < 128) {
              byteValue |= (1 << (7 - bit));
            }
          }
        }
        hexString += byteValue.toString(16).padStart(2, "0").toUpperCase();
      }
    }

    return { hex: hexString, width: w, height: h };
  }

  private rotateImageData(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const newWidth = height;
    const newHeight = width;
    const newData = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const oldIdx = (y * width + x) * 4;
        const newX = height - y - 1;
        const newY = x;
        const newIdx = (newY * newWidth + newX) * 4;

        newData[newIdx] = data[oldIdx];
        newData[newIdx + 1] = data[oldIdx + 1];
        newData[newIdx + 2] = data[oldIdx + 2];
        newData[newIdx + 3] = data[oldIdx + 3];
      }
    }

    return new ImageData(newData, newWidth, newHeight);
  }

  async print(elementId: string, options: PrintOptions) {
    if (!this.device?.opened) {
      throw new Error("Impressora não conectada via USB.");
    }

    const element = document.getElementById(elementId);
    if (!element) throw new Error("Elemento de impressão não encontrado.");

    this.isPrinting = true;
    this.updateStatus("Processando Etiqueta...", true);

    try {
      // 203 DPI = 8 dots per mm.
      // Standard CSS resolution is 96 DPI.
      // DPI Scale = 203 / 96 = ~2.11458
      const dpiScale = 203 / 96;

      const canvas = await html2canvas(element, {
        scale: dpiScale,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        width: options.widthMm * (96 / 25.4),
        height: options.heightMm * (96 / 25.4),
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            clonedElement.style.width = `${options.widthMm}mm`;
            clonedElement.style.height = `${options.heightMm}mm`;
            clonedElement.style.margin = "0";
            clonedElement.style.padding = "0";
            clonedElement.style.border = "none";
            clonedElement.style.boxShadow = "none";
            clonedElement.style.display = "flex";
            clonedElement.style.position = "static";
          }
        }
      });

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Falha ao obter contexto do canvas.");

      // Calculate target dots precisely
      const targetWidthDots = Math.round(options.widthMm * 8);
      const targetHeightDots = Math.round(options.heightMm * 8);

      let imgData = ctx.getImageData(0, 0, Math.min(canvas.width, targetWidthDots), Math.min(canvas.height, targetHeightDots));

      if (options.orientation === "R") {
        imgData = this.rotateImageData(imgData);
      }

      const { hex, width, height } = this.processImageData(imgData, options.dithering);
      
      const rowBytes = Math.ceil(width / 8);
      const byteCount = rowBytes * height;

      // ZPL Template for L42 PRO
      // ~SD: Darkness
      // ^PW: Print Width (Dots)
      // ^LL: Label Length (Dots)
      // ^FWN: Orientation Normal
      // ^GFA: Graphic Field ASCII
      const finalZpl = `^XA~SD${options.intensity}
^PW${width}^LL${height}^FWN
^MT${options.method}
^MN${options.mediaType}
^PR${options.speed}
^FO0,0^GFA,${byteCount},${byteCount},${rowBytes},${hex}
^PQ${options.quantity}
^XZ`;

      console.log("ZPL Generated. Width:", width, "Height:", height, "Bytes:", byteCount);

      this.updateStatus("Transmitindo para USB...", true);
      const encoder = new TextEncoder();
      const data = encoder.encode(finalZpl);
      
      await this.device.transferOut(1, data);
      
      this.updateStatus("Concluído!");
    } catch (err: any) {
      this.updateStatus(`Erro na impressão: ${err.message}`);
      throw err;
    } finally {
      this.isPrinting = false;
    }
  }

  async calibrate() {
    if (!this.device?.opened) throw new Error("Conecte a impressora primeiro.");
    const zpl = "~JC";
    const data = new TextEncoder().encode(zpl);
    await this.device.transferOut(1, data);
    this.updateStatus("Comando de calibração enviado.");
  }

  async saveDefaults(options: PrintOptions) {
    if (!this.device?.opened) throw new Error("Conecte a impressora primeiro.");
    const zpl = `^XA~SD${options.intensity}^PR${options.speed}^MT${options.method}^JUS^XZ`;
    const data = new TextEncoder().encode(zpl);
    await this.device.transferOut(1, data);
    this.updateStatus("Configurações gravadas como padrão.");
  }

  async cancelAll() {
    if (!this.device?.opened) throw new Error("Conecte a impressora primeiro.");
    const zpl = "~JA";
    const data = new TextEncoder().encode(zpl);
    await this.device.transferOut(1, data);
    this.updateStatus("Comando de cancelamento enviado.");
  }

  cancelPrint() {
    this.isPrinting = false;
  }
}
