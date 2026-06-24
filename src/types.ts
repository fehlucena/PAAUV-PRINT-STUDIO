export interface LabelDetail {
  id: string;
  label: string;
  value: string;
  show: boolean;
}

export type CodeFormat = "CODE128" | "EAN13" | "UPC" | "QR" | "NENHUM";
export type LabelPreset =
  | "100x150-1"
  | "100x100-1"
  | "100x75-1"
  | "100x75-2"
  | "100x50-1"
  | "50x30-2"
  | "33x22-3"
  | "custom";
export type LabelType = "retail" | "logistics";

export interface LabelConfig {
  labelType: LabelType;
  // Layout & Dimension
  preset: LabelPreset;
  width: number; // in mm (Total paper width)
  height: number; // in mm
  columns: number; // 1 or 2

  // Margins
  paddingTop: number;
  paddingBottom: number;
  paddingHorizontal: number;

  // Design
  fontFamily: string;
  serrilha: number;

  // Header
  logoBase64: string;
  showLogo: boolean;
  logoSize: number;
  headerLayout:
    | "logo-left"
    | "logo-right"
    | "logo-top"
    | "logo-bottom"
    | "space-between";
  headerGap: number;
  marca: string;
  showMarca: boolean;
  sizeMarca: number;
  marcaAlign: "left" | "center" | "right";
  marcaBold: boolean;
  marcaItalic: boolean;
  showCat: boolean;
  cat: string;

  // Product (Retail)
  produto: string;
  sizeProduto: number;
  details: LabelDetail[];

  // Logistics
  remetente: string;
  destinatario: string;
  pedido: string;
  peso: string;
  volumes: string;
  transportadora: string;

  // Barcode / Optical
  codeType: CodeFormat;
  codeValue: string;
  barcodeTextSpacing: number;
  barcodeTextSize: number;
  barcodeTextValue?: string;

  // Price & Promo
  showPrice: boolean;
  precoPrefix: string;
  preco: string;
  sizePreco: number;
  isPromo: boolean;
  promoText: string;
  precoAntigo: string;
}

export const defaultConfig: LabelConfig = {
  labelType: "retail",
  preset: "100x75-2",
  width: 100,
  height: 75,
  columns: 2,
  paddingTop: 4,
  paddingBottom: 2,
  paddingHorizontal: 3,
  fontFamily: "Inter, sans-serif",
  serrilha: 22,
  logoBase64: "",
  showLogo: true,
  logoSize: 12,
  headerLayout: "logo-left",
  headerGap: 2,
  marca: "PAAUV ERP",
  showMarca: true,
  sizeMarca: 13,
  marcaAlign: "left",
  marcaBold: true,
  marcaItalic: false,
  showCat: true,
  cat: "BAZAR",
  produto: "Camiseta Algodão",
  sizeProduto: 14,
  details: [
    { id: "1", label: "Tam:", value: "M / Azul", show: true },
    { id: "2", label: "Marca:", value: "Zara", show: true },
    { id: "3", label: "Estado:", value: "Seminovo", show: false },
  ],
  remetente:
    "PAAUV COMERCIO LTDA\\nRua das Flores, 123 - Centro\\nSão Paulo - SP / 01000-000",
  destinatario:
    "JOÃO DA SILVA\\nAv. Paulista, 1000 - Apto 45\\nBela Vista, São Paulo - SP\\n01310-100",
  pedido: "PED-2026991",
  peso: "1.5 kg",
  volumes: "1/1",
  transportadora: "Correios - SEDEX",
  codeType: "CODE128",
  codeValue: "HXW16X6U",
  barcodeTextSpacing: 1,
  barcodeTextSize: 10,
  barcodeTextValue: "",
  showPrice: true,
  precoPrefix: "R$",
  preco: "35,00",
  sizePreco: 24,
  isPromo: false,
  promoText: "PROMOÇÃO",
  precoAntigo: "De: R$ 50,00",
};
