import { LabelConfig } from "../types";
import html2canvas from "html2canvas";

export class PrinterService {
  private device: any = null;

  async requestConnection(): Promise<string> {
    try {
      // @ts-ignore
      const device = await navigator.usb.requestDevice({ filters: [] });
      await this.setupDevice(device);
      return device.productName || "Elgin L42 PRO";
    } catch (error: any) {
      console.error("USB Connection Error:", error);
      throw new Error(error.message || "Falha ao conectar via USB");
    }
  }

  async autoConnect(): Promise<string | null> {
    try {
      // @ts-ignore
      const devices = await navigator.usb.getDevices();
      if (devices.length > 0) {
        await this.setupDevice(devices[0]);
        return devices[0].productName || "Elgin L42 PRO";
      }
    } catch (error) {
      console.error("USB Auto-connect Error:", error);
    }
    return null;
  }

  private async setupDevice(device: any) {
    if (!device.opened) await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);
    await device.claimInterface(0);
    this.device = device;
  }

  async print(config: LabelConfig, copies: number = 1): Promise<void> {
    if (!this.device) {
      throw new Error("Impressora não conectada");
    }

    const printableArea = document.getElementById("printable-area-capture");
    if (!printableArea) {
      throw new Error("Área de captura não encontrada");
    }

    // 1. Calculate target dimensions
    // Claude specifies a FIXED width of 384 pixels for the JK01 family (48mm @ 8 dots/mm).
    // Even if the label is wider, we scale it to this "useful" width for this specific chipset protocol.
    const fixedWidthDots = 384;
    const dotsPerMm = 8;
    const targetHeightDots = Math.round(config.height * dotsPerMm);

    // 2. Capture using html2canvas with scaling to exactly 384px width
    const currentWidthPx = printableArea.offsetWidth;
    const scale = fixedWidthDots / (currentWidthPx || 1);

    const canvas = await html2canvas(printableArea, {
      scale: scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: currentWidthPx,
      height: printableArea.offsetHeight,
    });

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not get canvas context");

    // 3. Process image for Mirroring (if requested)
    if (config.printerMirror) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tCtx = tempCanvas.getContext("2d");
      if (tCtx) {
        tCtx.drawImage(canvas, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
      }
    }

    const imgData = ctx.getImageData(0, 0, fixedWidthDots, targetHeightDots);
    const hexImage = this.generateZPLHex(imgData, config.printerDithering === "floyd", config.printerNegative);
    
    const rowBytes = 48; // Fixed for 384px (384/8)
    const byteCount = rowBytes * targetHeightDots;

    const zpl = `^XA~SD${config.printerDarkness}
^PW${fixedWidthDots}^LL${targetHeightDots}^FW${config.printerOrientation}
^MT${config.printerMethod}
^MN${config.printerMediaType}
^PR${config.printerSpeed}
^FO0,0^GFA,${byteCount},${byteCount},${rowBytes},${hexImage}
^PQ${copies}
^XZ`;

    await this.sendToPrinter(zpl);
  }

  async calibrate(): Promise<void> {
    if (!this.device) throw new Error("Impressora não conectada");
    await this.sendToPrinter("~JC");
  }

  async cancelAll(): Promise<void> {
    if (!this.device) throw new Error("Impressora não conectada");
    await this.sendToPrinter("~JA");
  }

  async saveDefaults(config: LabelConfig): Promise<void> {
    if (!this.device) throw new Error("Impressora não conectada");
    const zpl = `^XA~SD${config.printerDarkness}^PR${config.printerSpeed}^MT${config.printerMethod}^JUS^XZ`;
    await this.sendToPrinter(zpl);
  }

  async setupNetwork(dhcp: boolean, ip?: string, mask?: string, gateway?: string): Promise<void> {
    if (!this.device) throw new Error("Impressora não conectada");
    let zpl = dhcp ? "^XA^ND2,P^XZ" : `^XA^ND2,S,${ip},${mask},${gateway}^XZ`;
    zpl += "~JR"; // Hard reset to apply
    await this.sendToPrinter(zpl);
  }

  private async sendToPrinter(data: string): Promise<void> {
    if (!this.device) return;
    const encoder = new TextEncoder();
    await this.device.transferOut(1, encoder.encode(data));
  }

  private generateZPLHex(imageData: ImageData, useDithering: boolean, isNegative: boolean): string {
    const { width, height, data } = imageData;
    const bytesPerRow = Math.ceil(width / 8); 
    
    // Convert to grayscale first for better processing
    let pixels = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      pixels[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114);
    }

    const bitmap = new Uint8Array(height * bytesPerRow);

    if (useDithering) {
      // Floyd-Steinberg Dithering
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldPixel = pixels[idx];
          const newPixel = oldPixel < 128 ? 0 : 255;
          pixels[idx] = newPixel;

          const quantError = (oldPixel - newPixel) / 16;
          if (x + 1 < width) pixels[idx + 1] += quantError * 7;
          if (y + 1 < height) {
            if (x > 0) pixels[idx + width - 1] += quantError * 3;
            pixels[idx + width] += quantError * 5;
            if (x + 1 < width) pixels[idx + width + 1] += quantError * 1;
          }

          let isBlack = newPixel === 0;
          if (isNegative) isBlack = !isBlack;

          if (isBlack) {
            const byteIndex = (y * bytesPerRow) + Math.floor(x / 8);
            const bitIndex = x % 8;
            bitmap[byteIndex] |= (1 << (7 - bitIndex)); // MSB First for ZPL ^GFA
          }
        }
      }
    } else {
      // Simple Thresholding
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const pixel = pixels[idx];
          let isBlack = pixel < 128;
          if (isNegative) isBlack = !isBlack;

          if (isBlack) {
            const byteIndex = (y * bytesPerRow) + Math.floor(x / 8);
            const bitIndex = x % 8;
            bitmap[byteIndex] |= (1 << (7 - bitIndex)); // MSB First for ZPL ^GFA
          }
        }
      }
    }

    let hexString = "";
    for (let i = 0; i < bitmap.length; i++) {
      hexString += bitmap[i].toString(16).padStart(2, "0").toUpperCase();
    }
    return hexString;
  }
}

export const printerService = new PrinterService();
