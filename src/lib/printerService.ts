import html2canvas from "html2canvas";

export interface PrinterStatus {
  connected: boolean;
  isPrinting: boolean;
  statusMessage: string;
  deviceName?: string;
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
      // For Elgin L42 Pro, we can use empty filters to let the user select, 
      // or specific vendorId/productId if known.
      this.device = await navigator.usb.requestDevice({ filters: [] });

      await this.device.open();
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }
      await this.device.claimInterface(0);

      this.updateStatus("Conectado");
      
      // Listen for disconnection
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

  private generateZPLHex(imageData: ImageData): string {
    const w = imageData.width;
    const h = imageData.height;
    const d = imageData.data;
    const rowBytes = Math.ceil(w / 8);
    let hexString = "";

    for (let y = 0; y < h; y++) {
      for (let b = 0; b < rowBytes; b++) {
        let byteValue = 0;
        for (let bit = 0; bit < 8; bit++) {
          const x = b * 8 + bit;
          if (x < w) {
            const idx = (y * w + x) * 4;
            // Grayscale threshold: Black if R < 128. ZPL: Black = 1, White = 0.
            const gray = (d[idx] + d[idx + 1] + d[idx + 2]) / 3;
            if (gray < 128) {
              byteValue |= (1 << (7 - bit));
            }
          }
        }
        hexString += byteValue.toString(16).padStart(2, "0").toUpperCase();
      }
    }
    return hexString;
  }

  async print(elementId: string, quantity: number = 1, intensity: number = 10) {
    if (!this.device?.opened) {
      throw new Error("Impressora não conectada via USB.");
    }

    const element = document.getElementById(elementId);
    if (!element) throw new Error("Elemento de impressão não encontrado.");

    this.isPrinting = true;
    this.updateStatus("Processando Etiqueta...", true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better definition on 203 DPI
        backgroundColor: "#ffffff",
      });

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Falha ao obter contexto do canvas.");

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hexImage = this.generateZPLHex(imgData);
      
      const rowBytes = Math.ceil(imgData.width / 8);
      const byteCount = rowBytes * imgData.height;
      const printWidthDots = imgData.width;

      // ZPL Template for L42 PRO
      // ~SD: Darkness (0-30 for ZPL, L42 Pro usually maps 0-15)
      // ^PW: Print Width
      // ^LL: Label Length
      // ^GFA: Graphic Field (A = ASCII hex)
      const zpl = `^XA~SD${intensity}
^PW${printWidthDots}^LL${imgData.height}^FWN
^FO0,0^GFA,${byteCount},${byteCount},${rowBytes},${hexImage}
^PQ${quantity}
^XZ`;

      this.updateStatus("Transmitindo para USB...", true);
      const encoder = new TextEncoder();
      const data = encoder.encode(zpl);
      
      // Standard USB bulk transfer on endpoint 1
      await this.device.transferOut(1, data);
      
      this.updateStatus("Concluído!");
    } catch (err: any) {
      this.updateStatus(`Erro na impressão: ${err.message}`);
      throw err;
    } finally {
      this.isPrinting = false;
    }
  }

  cancelPrint() {
    this.isPrinting = false;
  }
}
