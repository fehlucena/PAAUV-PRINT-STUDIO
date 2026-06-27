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

  private applyDitheringAndGenerateHex(imageData: ImageData): { hex: string; width: number; height: number } {
    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;
    
    // Convert to grayscale first
    const gray = new Float32Array(w * h);
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      gray[j] = (data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114);
    }

    // Floyd-Steinberg Dithering
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

    // Convert dithered grayscale to ZPL Hex (1 for black, 0 for white)
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

  async print(elementId: string, options: PrintOptions) {
    if (!this.device?.opened) {
      throw new Error("Impressora não conectada via USB.");
    }

    const element = document.getElementById(elementId);
    if (!element) throw new Error("Elemento de impressão não encontrado.");

    this.isPrinting = true;
    this.updateStatus("Processando Etiqueta...", true);

    try {
      // For L42 Pro 203 DPI, 1mm = 8 dots.
      // 96 DPI is the standard web resolution. 203 / 96 = ~2.1146
      const dpiScale = 203 / 96;

      const canvas = await html2canvas(element, {
        scale: dpiScale, 
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Falha ao obter contexto do canvas.");

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { hex, width, height } = this.applyDitheringAndGenerateHex(imgData);
      
      const rowBytes = Math.ceil(width / 8);
      const byteCount = rowBytes * height;

      // ZPL Template for L42 PRO
      const finalZpl = `^XA~SD${options.intensity}
^PW${width}^LL${height}^FWN
^MT${options.method}
^MN${options.mediaType}
^PR${options.speed}
^FO0,0^GFA,${byteCount},${byteCount},${rowBytes},${hex}
^PQ${options.quantity}
^XZ`;

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
