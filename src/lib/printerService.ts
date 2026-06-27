import html2canvas from "html2canvas";

// JK01 / V5X BLE Printer Protocol
const SERVICE_UUID = "0000ae30-0000-1000-8000-00805f9b34fb";
const NOTIFY_UUID = "0000ae02-0000-1000-8000-00805f9b34fb";
const CMD_UUID = "0000ae01-0000-1000-8000-00805f9b34fb";
const DATA_UUID = "0000ae03-0000-1000-8000-00805f9b34fb";

export interface PrinterStatus {
  connected: boolean;
  isPrinting: boolean;
  statusMessage: string;
  deviceName?: string;
}

export class PrinterService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private cmdChar: BluetoothRemoteGATTCharacteristic | null = null;
  private dataChar: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyChar: BluetoothRemoteGATTCharacteristic | null = null;
  private canWrite = true;
  private isPrinting = false;

  constructor(private onStatusUpdate: (status: PrinterStatus) => void) {}

  private updateStatus(message: string, isPrinting = false) {
    this.isPrinting = isPrinting;
    this.onStatusUpdate({
      connected: !!this.server?.connected,
      isPrinting: this.isPrinting,
      statusMessage: message,
      deviceName: this.device?.name,
    });
  }

  async connect() {
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth não suportado neste navegador.");
    }

    try {
      this.updateStatus("Buscando impressora...");
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "JK" }, { namePrefix: "TP" }],
        optionalServices: [SERVICE_UUID],
      });

      this.updateStatus("Conectando...");
      this.server = await this.device.gatt?.connect() || null;
      if (!this.server) throw new Error("Falha ao conectar ao servidor GATT.");

      const service = await this.server.getPrimaryService(SERVICE_UUID);
      this.cmdChar = await service.getCharacteristic(CMD_UUID);
      this.dataChar = await service.getCharacteristic(DATA_UUID);
      this.notifyChar = await service.getCharacteristic(NOTIFY_UUID);

      await this.notifyChar.startNotifications();
      this.notifyChar.addEventListener("characteristicvaluechanged", (e: any) => {
        const hex = Array.from(new Uint8Array(e.target.value.buffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (hex === "aa01") {
          this.canWrite = false;
          console.log("PAUSE");
        }
        if (hex === "aa00") {
          this.canWrite = true;
          console.log("RESUME");
        }
      });

      this.device.addEventListener("gattserverdisconnected", () => {
        this.updateStatus("Desconectado");
      });

      this.updateStatus("Conectado");
    } catch (err: any) {
      this.updateStatus(`Erro: ${err.message}`);
      throw err;
    }
  }

  async disconnect() {
    if (this.server?.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
    this.updateStatus("Desconectado");
  }

  async print(elementId: string, quantity: number = 1, intensity: number = 1) {
    if (!this.server?.connected || !this.cmdChar || !this.dataChar) {
      throw new Error("Impressora não conectada.");
    }

    const element = document.getElementById(elementId);
    if (!element) throw new Error("Elemento de impressão não encontrado.");

    this.isPrinting = true;
    this.updateStatus("Processando Imagem...", true);

    try {
      const canvas = await html2canvas(element, {
        scale: 1,
        width: 384,
        backgroundColor: "#ffffff",
      });

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Falha ao obter contexto do canvas.");

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const bytesPerRow = width / 8; // 48 bytes for 384 pixels
      
      const bitmap = new Uint8Array(height * bytesPerRow);
      const pixels = new Float32Array(width * height);

      // Convert to grayscale
      for (let i = 0; i < width * height; i++) {
        pixels[i] = (imgData.data[i * 4] + imgData.data[i * 4 + 1] + imgData.data[i * 4 + 2]) / 3;
      }

      // Floyd-Steinberg Dithering + LSB Bitmap mapping
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldPixel = pixels[idx];
          const newPixel = oldPixel < 128 ? 0 : 255;
          pixels[idx] = newPixel;
          const err = (oldPixel - newPixel) / 16;
          
          if (x + 1 < width) pixels[idx + 1] += err * 7;
          if (y + 1 < height) {
            if (x > 0) pixels[idx + width - 1] += err * 3;
            pixels[idx + width] += err * 5;
            if (x + 1 < width) pixels[idx + width + 1] += err * 1;
          }
          
          if (newPixel === 0) {
            const byte = (y * bytesPerRow) + Math.floor(x / 8);
            bitmap[byte] |= (1 << (x % 8)); // LSB First
          }
        }
      }

      const spacingRows = 12;
      const totalHeight = (height * quantity) + (spacingRows * (quantity - 1));
      const longBitmap = new Uint8Array(totalHeight * bytesPerRow);

      for (let q = 0; q < quantity; q++) {
        const offset = q * (height + spacingRows) * bytesPerRow;
        longBitmap.set(bitmap, offset);
      }

      this.updateStatus("Iniciando Impressão...", true);

      // 1. Handshake A7 (Init)
      await this.cmdChar.writeValueWithoutResponse(new Uint8Array([0x22, 0x21, 0xa7, 0x00, 0x00, 0x00, 0x00, 0x00]));
      await new Promise((r) => setTimeout(r, 600));

      // 2. Handshake A9 (Label Setup)
      const finalHL = totalHeight & 0xff;
      const finalHH = (totalHeight >> 8) & 0xff;
      const intensityByte = intensity & 0x0f;
      const a9 = new Uint8Array([0x22, 0x21, 0xa9, 0x00, intensityByte, 0x00, finalHH, finalHL, 0x30, 0x01, 0x00, 0x00]);
      await this.cmdChar.writeValueWithoutResponse(a9);
      await new Promise((r) => setTimeout(r, 600));

      // 3. Data Transmission (AE03)
      const CHUNK_SIZE = 48;
      for (let i = 0; i < longBitmap.length; i += CHUNK_SIZE) {
        if (!this.isPrinting) break;

        while (!this.canWrite) await new Promise((r) => setTimeout(r, 50));

        const chunk = longBitmap.slice(i, i + CHUNK_SIZE);
        await this.dataChar.writeValueWithoutResponse(chunk);

        if (i % 480 === 0) {
          this.updateStatus(`Transmitindo: ${Math.round((i / longBitmap.length) * 100)}%`, true);
        }
        await new Promise((r) => setTimeout(r, 40)); // Throttle
      }

      // 4. Finish AD
      if (this.isPrinting) {
        this.updateStatus("Finalizando...", true);
        await new Promise((r) => setTimeout(r, 600));
        await this.cmdChar.writeValueWithoutResponse(new Uint8Array([0x22, 0x21, 0xad, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]));
        this.updateStatus("Concluído!");
      } else {
        this.updateStatus("Impressão cancelada.");
      }
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
