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

    // 1. Calculate target dimensions in dots (203 DPI / 8 dots per mm)
    const dotsPerMm = 8;
    const targetWidthDots = Math.round(config.width * dotsPerMm);
    const targetHeightDots = Math.round(config.height * dotsPerMm);

    // 2. Capture using html2canvas with perfect scaling
    const currentWidthPx = printableArea.offsetWidth;
    const scale = targetWidthDots / (currentWidthPx || 1);

    const canvas = await html2canvas(printableArea, {
      scale: scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
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

    const imgData = ctx.getImageData(0, 0, targetWidthDots, targetHeightDots);
    const hexImage = this.generateZPLHex(imgData, config.printerDithering === "floyd", config.printerNegative);
    
    const rowBytes = Math.ceil(targetWidthDots / 8);
    const byteCount = rowBytes * targetHeightDots;

    const zpl = `^XA~SD${config.printerDarkness}
^PW${targetWidthDots}^LL${targetHeightDots}^FW${config.printerOrientation}
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
    const rowBytes = Math.ceil(width / 8);
    
    const pixels = new Uint8Array(width * height);
    
    if (useDithering) {
      const floatPixels = new Float32Array(width * height);
      for (let i = 0; i < width * height; i++) {
        floatPixels[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114);
      }

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldPixel = floatPixels[idx];
          const newPixel = oldPixel < 128 ? 0 : 255;
          floatPixels[idx] = newPixel;
          const err = (oldPixel - newPixel) / 16;
          
          if (x + 1 < width) floatPixels[idx + 1] += err * 7;
          if (y + 1 < height) {
            if (x > 0) floatPixels[idx + width - 1] += err * 3;
            floatPixels[idx + width] += err * 5;
            if (x + 1 < width) floatPixels[idx + width + 1] += err * 1;
          }

          let val = newPixel === 0 ? 1 : 0;
          if (isNegative) val = val === 1 ? 0 : 1;
          pixels[idx] = val;
        }
      }
    } else {
      for (let i = 0; i < width * height; i++) {
        const gray = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114);
        let val = gray < 128 ? 1 : 0;
        if (isNegative) val = val === 1 ? 0 : 1;
        pixels[i] = val;
      }
    }

    let hexString = "";
    for (let y = 0; y < height; y++) {
      for (let b = 0; b < rowBytes; b++) {
        let byteValue = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = b * 8 + bit;
          if (x < width) {
            if (pixels[y * width + x] === 1) {
              byteValue |= (1 << (7 - bit));
            }
          }
        }
        hexString += byteValue.toString(16).padStart(2, "0").toUpperCase();
      }
    }
    return hexString;
  }
}

export const printerService = new PrinterService();
