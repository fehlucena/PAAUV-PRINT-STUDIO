import React, { useState, useEffect } from "react";
import { LabelConfig, LabelDetail, CustomElement } from "../types";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Dices,
  LayoutTemplate,
  Type,
  Barcode as BarcodeIcon,
  Tag,
  Save,
  Star,
  Edit2,
} from "lucide-react";

interface SidebarProps {
  config: LabelConfig;
  setConfig: React.Dispatch<React.SetStateAction<LabelConfig>>;
}

const Switch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (c: boolean) => void;
}) => {
  return (
    <div
      className={`relative inline-block w-8 h-[18px] rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${checked ? "bg-amber-600" : "bg-slate-300"}`}
      onClick={() => onChange(!checked)}
    >
      <div
        className={`absolute top-[2px] left-[2px] bg-white w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-200 ease-in-out ${checked ? "translate-x-[14px]" : "translate-x-0"}`}
      />
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ config, setConfig }) => {
  const [activeTab, setActiveTab] = useState<
    "layout" | "content" | "barcode" | "price"
  >("layout");
  const [savedPresets, setSavedPresets] = useState<Record<string, LabelConfig>>(
    {},
  );
  const [currentPresetName, setCurrentPresetName] = useState<string>("");
  const [modalState, setModalState] = useState<{
    type: "save" | "rename" | "delete" | "alert" | null;
    message?: string;
  }>({ type: null });
  const [modalInput, setModalInput] = useState("");

  useEffect(() => {
    const loaded = localStorage.getItem("paauv-presets");
    if (loaded) {
      try {
        setSavedPresets(JSON.parse(loaded));
      } catch (e) {}
    }
  }, []);

  const handleSavePreset = () => {
    setModalInput(currentPresetName);
    setModalState({ type: "save" });
  };

  const executeSavePreset = (name: string) => {
    if (name) {
      const newPresets = { ...savedPresets, [name]: config };
      setSavedPresets(newPresets);
      localStorage.setItem("paauv-presets", JSON.stringify(newPresets));
      setCurrentPresetName(name);
    }
    setModalState({ type: null });
  };

  const handleRenamePreset = () => {
    if (!currentPresetName) return;
    setModalInput(currentPresetName);
    setModalState({ type: "rename" });
  };

  const executeRenamePreset = (newName: string) => {
    if (newName && newName !== currentPresetName) {
      const newPresets = { ...savedPresets };
      newPresets[newName] = newPresets[currentPresetName];
      delete newPresets[currentPresetName];
      setSavedPresets(newPresets);
      localStorage.setItem("paauv-presets", JSON.stringify(newPresets));
      setCurrentPresetName(newName);
    }
    setModalState({ type: null });
  };

  const handleDeletePreset = () => {
    if (!currentPresetName) return;
    setModalState({ type: "delete" });
  };

  const executeDeletePreset = () => {
    if (currentPresetName) {
      const newPresets = { ...savedPresets };
      delete newPresets[currentPresetName];
      setSavedPresets(newPresets);
      localStorage.setItem("paauv-presets", JSON.stringify(newPresets));
      setCurrentPresetName("");
    }
    setModalState({ type: null });
  };

  const handleSetDefault = () => {
    localStorage.setItem("paauv-default-preset", JSON.stringify(config));
    setModalState({
      type: "alert",
      message: "Configuração atual salva como o padrão ao abrir o aplicativo!",
    });
  };

  const handleLoadPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    if (name === "") {
      setCurrentPresetName("");
      return;
    }
    if (savedPresets[name]) {
      setConfig(savedPresets[name]);
      setCurrentPresetName(name);
    }
  };

  const updateConfig = (key: keyof LabelConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateConfig("logoBase64", event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      updateConfig("logoBase64", "");
    }
  };

  const handlePresetChange = (preset: string) => {
    updateConfig("preset", preset);
    if (preset === "100x150-1") {
      updateConfig("width", 100);
      updateConfig("height", 150);
      updateConfig("columns", 1);
    }
    if (preset === "100x100-1") {
      updateConfig("width", 100);
      updateConfig("height", 100);
      updateConfig("columns", 1);
    }
    if (preset === "100x75-1") {
      updateConfig("width", 100);
      updateConfig("height", 75);
      updateConfig("columns", 1);
    }
    if (preset === "100x75-2") {
      updateConfig("width", 100);
      updateConfig("height", 75);
      updateConfig("columns", 2);
    }
    if (preset === "100x50-1") {
      updateConfig("width", 100);
      updateConfig("height", 50);
      updateConfig("columns", 1);
    }
    if (preset === "50x30-2") {
      updateConfig("width", 100);
      updateConfig("height", 30);
      updateConfig("columns", 2);
    }
    if (preset === "33x22-3") {
      updateConfig("width", 100);
      updateConfig("height", 22);
      updateConfig("columns", 3);
    }
  };

  const updateDetail = (
    id: string,
    field: "label" | "value" | "show",
    value: string | boolean,
  ) => {
    setConfig((prev) => ({
      ...prev,
      details: prev.details.map((d) =>
        d.id === id ? { ...d, [field]: value } : d,
      ),
    }));
  };

  const addDetail = () => {
    setConfig((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        {
          id: Date.now().toString(),
          label: "Novo:",
          value: "Valor",
          show: true,
        },
      ],
    }));
  };

  const removeDetail = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      details: prev.details.filter((d) => d.id !== id),
    }));
  };

  const generateRandomBarcode = () => {
    if (config.codeType === "EAN13" || config.codeType === "UPC") {
      const digits = Math.floor(
        100000000000 + Math.random() * 900000000000,
      ).toString();
      updateConfig("codeValue", digits);
    } else {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 8; i++)
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      updateConfig("codeValue", result);
    }
  };

  return (
    <div className="w-[380px] bg-white border-r border-slate-200 h-full flex flex-col shrink-0 print:hidden text-slate-800 font-sans relative">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 px-2 pt-2 gap-1 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("layout")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "layout" ? "border-amber-600 text-amber-700 bg-white rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-md"}`}
        >
          <LayoutTemplate size={14} /> Layout
        </button>
        <button
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "content" ? "border-amber-600 text-amber-700 bg-white rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-md"}`}
        >
          <Type size={14} /> Conteúdo
        </button>
        <button
          onClick={() => setActiveTab("barcode")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "barcode" ? "border-amber-600 text-amber-700 bg-white rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-md"}`}
        >
          <BarcodeIcon size={14} /> Código
        </button>
        {config.labelType === "retail" && (
          <button
            onClick={() => setActiveTab("price")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "price" ? "border-amber-600 text-amber-700 bg-white rounded-t-md" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-t-md"}`}
          >
            <Tag size={14} /> Preço
          </button>
        )}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-white">
        {/* TAB: LAYOUT */}
        {activeTab === "layout" && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Aplicação da Etiqueta
              </label>
              <div className="flex bg-slate-100 rounded-md p-1 gap-1 border border-slate-200">
                <button
                  onClick={() => {
                    updateConfig("labelType", "retail");
                    updateConfig("preset", "100x75-2");
                    updateConfig("width", 100);
                    updateConfig("height", 75);
                    updateConfig("columns", 2);
                  }}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-colors ${config.labelType === "retail" ? "bg-white shadow-sm text-amber-700 border border-slate-200" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  Loja / Produto
                </button>
                <button
                  onClick={() => {
                    updateConfig("labelType", "logistics");
                    updateConfig("preset", "100x150-1");
                    updateConfig("width", 100);
                    updateConfig("height", 150);
                    updateConfig("columns", 1);
                    if (activeTab === "price") setActiveTab("layout");
                  }}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-colors ${config.labelType === "logistics" ? "bg-white shadow-sm text-amber-700 border border-slate-200" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  Logística / Envio
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Dimensões & Padrão
              </label>
              <select
                className="bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-md text-xs w-full outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-shadow"
                value={config.preset}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                <option value="100x150-1">
                  100x150mm (Logística/Correios/ML)
                </option>
                <option value="100x100-1">100x100mm (Expedição)</option>
                <option value="100x75-1">100x75mm (1 Coluna)</option>
                <option value="100x75-2">
                  100x75mm (2 Colunas - 50x75mm cada)
                </option>
                <option value="100x50-1">100x50mm (Gôndola/Produto)</option>
                <option value="50x30-2">100x30mm (2 Colunas de 50x30mm)</option>
                <option value="33x22-3">100x22mm (3 Colunas de 33x22mm)</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {config.preset === "custom" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Largura (mm)
                  </label>
                  <input
                    type="number"
                    value={config.width}
                    onChange={(e) =>
                      updateConfig("width", Number(e.target.value))
                    }
                    className="bg-white border border-slate-300 px-2 py-1.5 rounded text-xs w-full outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Altura (mm)
                  </label>
                  <input
                    type="number"
                    value={config.height}
                    onChange={(e) =>
                      updateConfig("height", Number(e.target.value))
                    }
                    className="bg-white border border-slate-300 px-2 py-1.5 rounded text-xs w-full outline-none focus:border-amber-500"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Colunas (P/ Linha)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={config.columns}
                    onChange={(e) =>
                      updateConfig("columns", Number(e.target.value))
                    }
                    className="bg-white border border-slate-300 px-2 py-1.5 rounded text-xs w-full outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-amber-900">Girar 90º na Impressão</span>
                <span className="text-[10px] text-amber-700">Se a impressora estiver cortando ou imprimindo de lado.</span>
              </div>
              <Switch
                checked={config.printRotate90}
                onChange={(c) => updateConfig("printRotate90", c)}
              />
            </div>

            <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-600">
                Margens Internas (Padding)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Topo (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.paddingTop || 0}
                    onChange={(e) =>
                      updateConfig("paddingTop", Number(e.target.value))
                    }
                    className="bg-white border border-slate-300 px-2 py-1.5 rounded text-xs w-full outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Laterais (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.paddingHorizontal || 0}
                    onChange={(e) =>
                      updateConfig("paddingHorizontal", Number(e.target.value))
                    }
                    className="bg-white border border-slate-300 px-2 py-1.5 rounded text-xs w-full outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    Base (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.paddingBottom || 0}
                    onChange={(e) =>
                      updateConfig("paddingBottom", Number(e.target.value))
                    }
                    className="bg-white border border-slate-300 px-2 py-1.5 rounded text-xs w-full outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-600">
                Tipografia Global
              </label>
              <select
                className="bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-md text-xs w-full outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-shadow"
                value={config.fontFamily}
                onChange={(e) => updateConfig("fontFamily", e.target.value)}
              >
                <option value="Inter, sans-serif">
                  Inter (Moderno / Padrão ERP)
                </option>
                <option value="Oswald, sans-serif">
                  Oswald (Compacto / Impacto)
                </option>
                <option value="Arial, sans-serif">Arial (Clássico)</option>
                <option value="'Roboto Mono', monospace">
                  Roboto Mono (Técnico / Código)
                </option>
              </select>
            </div>
          </div>
        )}

        {/* TAB: CONTENT */}
        {activeTab === "content" && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header Section */}
            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Cabeçalho
              </h3>

              <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Exibir Logo
                  </label>
                  <Switch
                    checked={config.showLogo}
                    onChange={(c) => updateConfig("showLogo", c)}
                  />
                </div>
                {config.showLogo && (
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="text-[11px] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer w-full"
                      onChange={handleLogoUpload}
                    />
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Tamanho
                      </span>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        value={config.logoSize}
                        onChange={(e) =>
                          updateConfig("logoSize", Number(e.target.value))
                        }
                        className="flex-grow accent-amber-600"
                      />
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                        {config.logoSize}mm
                      </span>
                    </div>
                    {config.logoBase64 && (
                      <button
                        className="text-[10px] text-red-500 hover:text-red-600 font-medium self-start mt-1"
                        onClick={() => updateConfig("logoBase64", "")}
                      >
                        Remover Logo Atual
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-md border border-slate-200 mt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Exibir Texto da Marca
                  </label>
                  <Switch
                    checked={config.showMarca}
                    onChange={(c) => updateConfig("showMarca", c)}
                  />
                </div>
                {config.showMarca && (
                  <>
                    <input
                      type="text"
                      value={config.marca}
                      onChange={(e) => updateConfig("marca", e.target.value)}
                      placeholder="Nome da Marca"
                      className="bg-white border border-slate-300 text-slate-800 px-3 py-1.5 rounded-md text-xs w-full outline-none focus:border-amber-500"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-white border border-slate-300 rounded p-0.5">
                        <button
                          onClick={() => updateConfig("marcaAlign", "left")}
                          className={`p-1.5 rounded text-slate-600 ${config.marcaAlign === "left" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                        >
                          <AlignLeft size={13} />
                        </button>
                        <button
                          onClick={() => updateConfig("marcaAlign", "center")}
                          className={`p-1.5 rounded text-slate-600 ${config.marcaAlign === "center" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                        >
                          <AlignCenter size={13} />
                        </button>
                        <button
                          onClick={() => updateConfig("marcaAlign", "right")}
                          className={`p-1.5 rounded text-slate-600 ${config.marcaAlign === "right" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                        >
                          <AlignRight size={13} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-slate-300 rounded p-0.5">
                        <button
                          onClick={() =>
                            updateConfig("marcaBold", !config.marcaBold)
                          }
                          className={`p-1.5 rounded text-slate-600 ${config.marcaBold ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                        >
                          <Bold size={13} />
                        </button>
                        <button
                          onClick={() =>
                            updateConfig("marcaItalic", !config.marcaItalic)
                          }
                          className={`p-1.5 rounded text-slate-600 ${config.marcaItalic ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                        >
                          <Italic size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 mt-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Fonte
                      </span>
                      <input
                        type="range"
                        min="8"
                        max="36"
                        value={config.sizeMarca}
                        onChange={(e) =>
                          updateConfig("sizeMarca", Number(e.target.value))
                        }
                        className="flex-grow accent-amber-600"
                      />
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                        {config.sizeMarca}px
                      </span>
                    </div>
                  </>
                )}
              </div>

              {config.showLogo && config.showMarca && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <select
                    value={config.headerLayout}
                    onChange={(e) =>
                      updateConfig("headerLayout", e.target.value)
                    }
                    className="bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-md text-xs w-full outline-none focus:border-amber-500"
                  >
                    <option value="logo-left">Logo à Esquerda da Marca</option>
                    <option value="logo-right">Logo à Direita da Marca</option>
                    <option value="logo-top">Logo acima da Marca</option>
                    <option value="logo-bottom">Logo abaixo da Marca</option>
                    <option value="space-between">
                      Logo e Marca Separados (Extremos)
                    </option>
                  </select>
                  {config.headerLayout !== "space-between" && (
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Distância
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={config.headerGap}
                        onChange={(e) =>
                          updateConfig("headerGap", Number(e.target.value))
                        }
                        className="flex-grow accent-amber-600"
                      />
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                        {config.headerGap}mm
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2.5 mt-4 pt-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold w-16" title="Ajusta o espaçamento entre o cabeçalho e os elementos abaixo">
                  Espaço Abaixo
                </span>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="1"
                  value={config.bodyMarginTop}
                  onChange={(e) =>
                    updateConfig("bodyMarginTop", Number(e.target.value))
                  }
                  className="flex-grow accent-amber-600"
                />
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono w-10 text-center">
                  {config.bodyMarginTop}mm
                </span>
              </div>

              {config.labelType === "retail" && (
                <>
                  <div className="flex items-center justify-between mt-4">
                    <label className="text-xs font-semibold text-slate-600">
                      Categoria/Setor (Canto Sup.)
                    </label>
                    <Switch
                      checked={config.showCat}
                      onChange={(c) => updateConfig("showCat", c)}
                    />
                  </div>
                  {config.showCat && (
                    <input
                      type="text"
                      value={config.cat}
                      onChange={(e) => updateConfig("cat", e.target.value)}
                      className="bg-white border border-slate-300 px-3 py-1.5 rounded-md text-xs w-full outline-none focus:border-amber-500 mt-1"
                    />
                  )}
                </>
              )}

              <div className="flex items-center justify-between mt-4">
                <label className="text-xs font-semibold text-slate-600">
                  Conteúdo (Texto Livre)
                </label>
                <Switch
                  checked={config.showConteudo}
                  onChange={(c) => updateConfig("showConteudo", c)}
                />
              </div>
              {config.showConteudo && (
                <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-md border border-slate-200 mt-2">
                  <textarea
                    rows={4}
                    value={config.conteudoText}
                    onChange={(e) =>
                      updateConfig("conteudoText", e.target.value)
                    }
                    placeholder="Adicione texto livre aqui..."
                    className="bg-white border border-slate-300 px-2 py-1.5 rounded-md text-[11px] w-full outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded p-0.5">
                      <button
                        onClick={() => updateConfig("conteudoAlign", "left")}
                        className={`p-1.5 rounded text-slate-600 ${config.conteudoAlign === "left" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                      >
                        <AlignLeft size={13} />
                      </button>
                      <button
                        onClick={() => updateConfig("conteudoAlign", "center")}
                        className={`p-1.5 rounded text-slate-600 ${config.conteudoAlign === "center" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                      >
                        <AlignCenter size={13} />
                      </button>
                      <button
                        onClick={() => updateConfig("conteudoAlign", "right")}
                        className={`p-1.5 rounded text-slate-600 ${config.conteudoAlign === "right" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                      >
                        <AlignRight size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold w-16">
                      Tam. Fonte
                    </span>
                    <input
                      type="range"
                      min="8"
                      max="48"
                      value={config.conteudoSize}
                      onChange={(e) =>
                        updateConfig("conteudoSize", Number(e.target.value))
                      }
                      className="flex-grow accent-amber-600"
                    />
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono w-10 text-center">
                      {config.conteudoSize}px
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold w-16">
                      Margem Top
                    </span>
                    <input
                      type="range"
                      min="-20"
                      max="50"
                      step="1"
                      value={config.conteudoMarginTop}
                      onChange={(e) =>
                        updateConfig(
                          "conteudoMarginTop",
                          Number(e.target.value),
                        )
                      }
                      className="flex-grow accent-amber-600"
                    />
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono w-10 text-center">
                      {config.conteudoMarginTop}mm
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Product/Logistics Section */}
            <div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 pt-4 border-t border-slate-100">
                {config.labelType === "retail"
                  ? "Dados do Produto"
                  : "Dados de Envio"}
              </h3>

              {config.labelType === "retail" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600">
                        Nome do Produto
                      </label>
                      <div className="flex items-center gap-1 bg-white border border-slate-300 rounded p-0.5">
                        <button
                          onClick={() => updateConfig("produtoAlign", "left")}
                          className={`p-1.5 rounded text-slate-600 ${config.produtoAlign === "left" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                        >
                          <AlignLeft size={13} />
                        </button>
                        <button
                          onClick={() => updateConfig("produtoAlign", "center")}
                          className={`p-1.5 rounded text-slate-600 ${config.produtoAlign === "center" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                        >
                          <AlignCenter size={13} />
                        </button>
                        <button
                          onClick={() => updateConfig("produtoAlign", "right")}
                          className={`p-1.5 rounded text-slate-600 ${config.produtoAlign === "right" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                        >
                          <AlignRight size={13} />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={config.produto}
                      onChange={(e) => updateConfig("produto", e.target.value)}
                      className="bg-white border border-slate-300 px-3 py-2 rounded-md text-xs w-full outline-none focus:border-amber-500"
                    />
                    <div className="flex items-center gap-2.5 mt-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold min-w-[65px]">
                        Tam. Fonte
                      </span>
                      <input
                        type="range"
                        min="10"
                        max="22"
                        value={config.sizeProduto}
                        onChange={(e) =>
                          updateConfig("sizeProduto", Number(e.target.value))
                        }
                        className="flex-grow accent-amber-600"
                      />
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono w-9 text-center">
                        {config.sizeProduto}px
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mt-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold min-w-[65px]">
                        Espaçamento
                      </span>
                      <input
                        type="range"
                        min="-10"
                        max="20"
                        step="0.5"
                        value={config.produtoMarginTop || 0}
                        onChange={(e) =>
                          updateConfig(
                            "produtoMarginTop",
                            Number(e.target.value),
                          )
                        }
                        className="flex-grow accent-amber-600"
                      />
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono w-9 text-center">
                        {config.produtoMarginTop || 0}
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-200 p-3 bg-slate-50 rounded-md flex flex-col gap-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Tabela de Atributos
                      </label>
                      <button
                        onClick={addDetail}
                        className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-amber-200 transition-colors"
                      >
                        <Plus size={12} /> Nova Linha
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2 w-1/2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">
                          Tam. Fonte
                        </span>
                        <input
                          type="range"
                          min="8"
                          max="16"
                          value={config.detailsSize}
                          onChange={(e) =>
                            updateConfig("detailsSize", Number(e.target.value))
                          }
                          className="flex-grow accent-amber-600 w-16"
                        />
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          {config.detailsSize}px
                        </span>
                      </div>

                      <select
                        value={config.detailsAlign}
                        onChange={(e) =>
                          updateConfig("detailsAlign", e.target.value)
                        }
                        className="bg-white border border-slate-300 text-slate-800 px-2 py-1 rounded text-[10px] outline-none focus:border-amber-500 w-1/2 ml-2"
                      >
                        <option value="between">
                          Espaçado (Esquerda/Direita)
                        </option>
                        <option value="left">Alinhado à Esquerda</option>
                        <option value="center">Centralizado</option>
                        <option value="right">Alinhado à Direita</option>
                      </select>
                    </div>

                    {config.details.map((detail) => (
                      <div
                        key={detail.id}
                        className="flex gap-1.5 items-center bg-white p-1.5 border border-slate-200 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={detail.show}
                          onChange={(e) =>
                            updateDetail(detail.id, "show", e.target.checked)
                          }
                          className="accent-amber-600 w-3.5 h-3.5 cursor-pointer ml-1 shrink-0"
                        />
                        <input
                          type="text"
                          value={detail.label}
                          onChange={(e) =>
                            updateDetail(detail.id, "label", e.target.value)
                          }
                          placeholder="Campo"
                          className="border-none text-slate-800 text-[11px] w-[35%] outline-none font-semibold bg-transparent"
                        />
                        <input
                          type="text"
                          value={detail.value}
                          onChange={(e) =>
                            updateDetail(detail.id, "value", e.target.value)
                          }
                          placeholder="Valor"
                          className="border-none text-slate-600 text-[11px] flex-grow outline-none bg-transparent"
                        />
                        <button
                          onClick={() => removeDetail(detail.id)}
                          className="text-slate-400 hover:text-red-500 p-1 shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 border border-slate-200 p-2 rounded-md bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        Remetente
                      </label>
                      <button
                        onClick={() =>
                          updateConfig("showRemetente", !config.showRemetente)
                        }
                        className={`w-8 h-4 rounded-full transition-colors relative ${config.showRemetente ? "bg-amber-500" : "bg-slate-300"}`}
                      >
                        <div
                          className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${config.showRemetente ? "translate-x-4" : "translate-x-0.5"}`}
                        />
                      </button>
                    </div>
                    {config.showRemetente && (
                      <>
                        <textarea
                          rows={3}
                          value={config.remetente}
                          onChange={(e) =>
                            updateConfig("remetente", e.target.value)
                          }
                          className="bg-white border border-slate-300 text-slate-800 px-2 py-1.5 rounded-md text-[11px] w-full outline-none focus:border-amber-500"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-500 uppercase font-bold min-w-[50px]">
                            Tam.
                          </span>
                          <input
                            type="range"
                            min="6"
                            max="16"
                            value={config.remetenteSize}
                            onChange={(e) =>
                              updateConfig(
                                "remetenteSize",
                                Number(e.target.value),
                              )
                            }
                            className="flex-grow accent-amber-600"
                          />
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-mono w-6 text-center">
                            {config.remetenteSize}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 border border-slate-200 p-2 rounded-md bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        Destinatário
                      </label>
                      <button
                        onClick={() =>
                          updateConfig(
                            "showDestinatario",
                            !config.showDestinatario,
                          )
                        }
                        className={`w-8 h-4 rounded-full transition-colors relative ${config.showDestinatario ? "bg-amber-500" : "bg-slate-300"}`}
                      >
                        <div
                          className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${config.showDestinatario ? "translate-x-4" : "translate-x-0.5"}`}
                        />
                      </button>
                    </div>
                    {config.showDestinatario && (
                      <>
                        <textarea
                          rows={4}
                          value={config.destinatario}
                          onChange={(e) =>
                            updateConfig("destinatario", e.target.value)
                          }
                          className="bg-white border border-slate-300 text-slate-800 px-2 py-1.5 rounded-md text-[11px] w-full outline-none focus:border-amber-500"
                        />
                        <div className="flex flex-col gap-1.5 mt-1 bg-white border border-slate-100 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-500 uppercase font-bold min-w-[50px]">
                              Tam.
                            </span>
                            <input
                              type="range"
                              min="8"
                              max="24"
                              value={config.destinatarioSize}
                              onChange={(e) =>
                                updateConfig(
                                  "destinatarioSize",
                                  Number(e.target.value),
                                )
                              }
                              className="flex-grow accent-amber-600"
                            />
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-mono w-6 text-center">
                              {config.destinatarioSize}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-slate-500 uppercase font-bold min-w-[50px]" title="Margem Top">
                              Margem
                            </span>
                            <input
                              type="range"
                              min="-20"
                              max="50"
                              step="1"
                              value={config.destinatarioMarginTop}
                              onChange={(e) =>
                                updateConfig(
                                  "destinatarioMarginTop",
                                  Number(e.target.value),
                                )
                              }
                              className="flex-grow accent-amber-600"
                            />
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-mono w-6 text-center">
                              {config.destinatarioMarginTop}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 border border-slate-200 p-2 rounded-md bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        Informações (Pedido, Peso, etc)
                      </label>
                      <button
                        onClick={() =>
                          updateConfig("showInfoRow", !config.showInfoRow)
                        }
                        className={`w-8 h-4 rounded-full transition-colors relative ${config.showInfoRow ? "bg-amber-500" : "bg-slate-300"}`}
                      >
                        <div
                          className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${config.showInfoRow ? "translate-x-4" : "translate-x-0.5"}`}
                        />
                      </button>
                    </div>
                    {config.showInfoRow && (
                      <>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Pedido/NFe
                            </label>
                            <input
                              type="text"
                              value={config.pedido}
                              onChange={(e) =>
                                updateConfig("pedido", e.target.value)
                              }
                              className="bg-white border border-slate-300 px-2 py-1.5 rounded-md text-[11px] w-full outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Peso
                            </label>
                            <input
                              type="text"
                              value={config.peso}
                              onChange={(e) =>
                                updateConfig("peso", e.target.value)
                              }
                              className="bg-white border border-slate-300 px-2 py-1.5 rounded-md text-[11px] w-full outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Volumes
                            </label>
                            <input
                              type="text"
                              value={config.volumes}
                              onChange={(e) =>
                                updateConfig("volumes", e.target.value)
                              }
                              className="bg-white border border-slate-300 px-2 py-1.5 rounded-md text-[11px] w-full outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Transportadora
                            </label>
                            <input
                              type="text"
                              value={config.transportadora}
                              onChange={(e) =>
                                updateConfig("transportadora", e.target.value)
                              }
                              className="bg-white border border-slate-300 px-2 py-1.5 rounded-md text-[11px] w-full outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] text-slate-500 uppercase font-bold min-w-[70px]">
                            Tam. Infos
                          </span>
                          <input
                            type="range"
                            min="6"
                            max="16"
                            value={config.infoRowSize}
                            onChange={(e) =>
                              updateConfig(
                                "infoRowSize",
                                Number(e.target.value),
                              )
                            }
                            className="flex-grow accent-amber-600"
                          />
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-mono w-6 text-center">
                            {config.infoRowSize}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: BARCODE */}
        {activeTab === "barcode" && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Simbologia Óptica
              </label>
              <select
                value={config.codeType}
                onChange={(e) => updateConfig("codeType", e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-md text-xs w-full outline-none focus:border-amber-500"
              >
                <option value="CODE128">Code 128 (Alfanumérico Padrão)</option>
                <option value="EAN13">
                  EAN-13 (12 ou 13 dígitos numéricos)
                </option>
                <option value="UPC">UPC-A (11 ou 12 dígitos numéricos)</option>
                <option value="QR">QR Code (Links ou Dados Longos)</option>
                <option value="NENHUM">Não exibir código</option>
              </select>
            </div>

            {config.codeType !== "NENHUM" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">
                    Valor do Código (SKU/Link)
                  </label>
                  <button
                    onClick={generateRandomBarcode}
                    className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-100 transition-colors"
                  >
                    <Dices size={12} /> Gerar
                  </button>
                </div>
                <input
                  type="text"
                  value={config.codeValue}
                  onChange={(e) => updateConfig("codeValue", e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-md text-xs w-full outline-none focus:border-amber-500 font-mono uppercase"
                />
              </div>
            )}

            {config.codeType !== "NENHUM" &&
              config.labelType === "logistics" && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Alinhamento do Código
                  </label>
                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded p-0.5 w-max">
                    <button
                      onClick={() => updateConfig("codeAlign", "left")}
                      className={`p-1.5 rounded text-slate-600 ${config.codeAlign === "left" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                    >
                      <AlignLeft size={13} />
                    </button>
                    <button
                      onClick={() => updateConfig("codeAlign", "center")}
                      className={`p-1.5 rounded text-slate-600 ${config.codeAlign === "center" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                    >
                      <AlignCenter size={13} />
                    </button>
                    <button
                      onClick={() => updateConfig("codeAlign", "right")}
                      className={`p-1.5 rounded text-slate-600 ${config.codeAlign === "right" ? "bg-slate-200 text-slate-900 shadow-sm" : "hover:bg-slate-100"}`}
                    >
                      <AlignRight size={13} />
                    </button>
                  </div>
                </div>
              )}

            {config.codeType !== "NENHUM" && config.labelType === "retail" && (
              <>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Posição Vertical do Bloco Inteiro (Cima/Baixo)
                    </label>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      {config.codeMarginTop || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="0.5"
                    value={config.codeMarginTop || 0}
                    onChange={(e) =>
                      updateConfig("codeMarginTop", Number(e.target.value))
                    }
                    className="w-full accent-amber-600"
                  />
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Texto Visual do Código (Opcional)
                  </label>
                  <input
                    type="text"
                    value={config.barcodeTextValue || ""}
                    onChange={(e) =>
                      updateConfig("barcodeTextValue", e.target.value)
                    }
                    placeholder="Deixe vazio para mostrar o valor acima"
                    className="bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-md text-xs w-full outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Posição Vertical Apenas do Texto
                    </label>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      {config.barcodeTextSpacing}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="0.5"
                    value={config.barcodeTextSpacing}
                    onChange={(e) =>
                      updateConfig("barcodeTextSpacing", Number(e.target.value))
                    }
                    className="w-full accent-amber-600"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Tamanho do Texto (px)
                    </label>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      {config.barcodeTextSize}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="24"
                    step="0.5"
                    value={config.barcodeTextSize}
                    onChange={(e) =>
                      updateConfig("barcodeTextSize", Number(e.target.value))
                    }
                    className="w-full accent-amber-600"
                  />
                </div>
              </>
            )}

            <div className="text-[11px] text-slate-600 bg-amber-50 p-3 rounded-md border border-amber-100 leading-relaxed mt-2">
              <strong>Dica de Impressão:</strong> Para leitores ópticos em
              etiquetas térmicas, use fundo branco puro e ajuste a densidade da
              impressora se as barras ficarem borradas.
            </div>
          </div>
        )}

        {/* TAB: PRICE */}
        {activeTab === "price" && config.labelType === "retail" && (
          <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <label className="text-xs font-semibold text-slate-700">
                Ativar Seção de Preço
              </label>
              <Switch
                checked={config.showPrice}
                onChange={(c) => updateConfig("showPrice", c)}
              />
            </div>

            {config.showPrice && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Posição da Serrilha (Margem inferior)
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="range"
                      min="15"
                      max="35"
                      value={config.serrilha}
                      onChange={(e) =>
                        updateConfig("serrilha", Number(e.target.value))
                      }
                      className="flex-grow accent-amber-600"
                    />
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      {config.serrilha}mm
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Moeda
                    </label>
                    <input
                      type="text"
                      value={config.precoPrefix}
                      onChange={(e) =>
                        updateConfig("precoPrefix", e.target.value)
                      }
                      className="bg-white border border-slate-300 px-2 py-1.5 rounded text-xs w-full outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Valor de Venda
                    </label>
                    <input
                      type="text"
                      value={config.preco}
                      onChange={(e) => updateConfig("preco", e.target.value)}
                      className="bg-white border border-slate-300 px-2 py-1.5 rounded text-xs w-full outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Tamanho do Preço
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="range"
                      min="16"
                      max="40"
                      value={config.sizePreco}
                      onChange={(e) =>
                        updateConfig("sizePreco", Number(e.target.value))
                      }
                      className="flex-grow accent-amber-600"
                    />
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                      {config.sizePreco}px
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 p-3 bg-slate-50 rounded-md mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-700">
                      Destaque Promocional
                    </label>
                    <Switch
                      checked={config.isPromo}
                      onChange={(c) => updateConfig("isPromo", c)}
                    />
                  </div>

                  {config.isPromo && (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Selo Promo
                        </label>
                        <input
                          type="text"
                          value={config.promoText}
                          onChange={(e) =>
                            updateConfig("promoText", e.target.value)
                          }
                          placeholder="Ex: OFERTA"
                          className="bg-white border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Preço Antigo
                        </label>
                        <input
                          type="text"
                          value={config.precoAntigo}
                          onChange={(e) =>
                            updateConfig("precoAntigo", e.target.value)
                          }
                          placeholder="Ex: De: R$ 50,00"
                          className="bg-white border border-slate-300 px-2 py-1.5 rounded text-[11px] w-full outline-none focus:border-amber-500 font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Preset Section inside scrollable content */}
        <div className="border border-slate-200 p-4 bg-slate-50 rounded-md mt-6 mb-2">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Save size={14} /> Presets Salvos
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <select
                onChange={handleLoadPreset}
                className="bg-white border border-slate-300 text-slate-700 px-2 py-1.5 rounded-md text-xs outline-none focus:border-amber-500 flex-1 shadow-sm font-medium"
                value={currentPresetName || ""}
              >
                <option value="">Nenhum / Novo...</option>
                {Object.keys(savedPresets).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={handleSavePreset}
                className="bg-white border border-slate-300 text-slate-700 hover:text-amber-700 p-1.5 rounded text-xs font-semibold hover:bg-amber-50 transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <Save size={12} />{" "}
                {currentPresetName ? "Sobrescrever" : "Salvar Novo"}
              </button>
              <button
                onClick={handleSetDefault}
                className="bg-white border border-slate-300 text-slate-700 hover:text-amber-700 p-1.5 rounded text-xs font-semibold hover:bg-amber-50 transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <Star size={12} /> Padrão Inicial
              </button>
              {currentPresetName && (
                <>
                  <button
                    onClick={handleRenamePreset}
                    className="bg-white border border-slate-300 text-slate-700 hover:text-amber-700 p-1.5 rounded text-xs font-semibold hover:bg-amber-50 transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Edit2 size={12} /> Renomear
                  </button>
                  <button
                    onClick={handleDeletePreset}
                    className="bg-white border border-red-300 text-red-600 hover:text-white p-1.5 rounded text-xs font-semibold hover:bg-red-500 transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preset Modal Overlays */}
      {modalState.type && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg shadow-xl w-full p-4 flex flex-col gap-4">
            {modalState.type === "save" && (
              <>
                <h4 className="text-sm font-bold text-slate-800">
                  Salvar Preset
                </h4>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-600">
                    Nome do Preset:
                  </label>
                  <input
                    type="text"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    className="bg-white border border-slate-300 px-3 py-2 rounded-md text-xs w-full outline-none focus:border-amber-500"
                    placeholder="Ex: Minha Etiqueta"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setModalState({ type: null })}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => executeSavePreset(modalInput)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-sm"
                  >
                    Salvar
                  </button>
                </div>
              </>
            )}

            {modalState.type === "rename" && (
              <>
                <h4 className="text-sm font-bold text-slate-800">
                  Renomear Preset
                </h4>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-600">Novo Nome:</label>
                  <input
                    type="text"
                    value={modalInput}
                    onChange={(e) => setModalInput(e.target.value)}
                    className="bg-white border border-slate-300 px-3 py-2 rounded-md text-xs w-full outline-none focus:border-amber-500"
                    placeholder="Ex: Novo Nome"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setModalState({ type: null })}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => executeRenamePreset(modalInput)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-sm"
                  >
                    Renomear
                  </button>
                </div>
              </>
            )}

            {modalState.type === "delete" && (
              <>
                <h4 className="text-sm font-bold text-slate-800">
                  Excluir Preset
                </h4>
                <p className="text-xs text-slate-600">
                  Tem certeza que deseja excluir o preset "{currentPresetName}"?
                </p>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setModalState({ type: null })}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => executeDeletePreset()}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded shadow-sm"
                  >
                    Excluir
                  </button>
                </div>
              </>
            )}

            {modalState.type === "alert" && (
              <>
                <h4 className="text-sm font-bold text-slate-800">Aviso</h4>
                <p className="text-xs text-slate-600">{modalState.message}</p>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setModalState({ type: null })}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-sm"
                  >
                    OK
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
