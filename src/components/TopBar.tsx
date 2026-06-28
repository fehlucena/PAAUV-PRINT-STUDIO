import React, { useRef } from 'react';
import { Download, Upload, Printer, ZoomIn, ZoomOut, User, LogOut, Shield, Usb, Loader2 } from 'lucide-react';
import { LabelConfig } from '../types';
import { useAuth } from '../lib/AuthContext';

interface TopBarProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  config: LabelConfig;
  setConfig: (config: LabelConfig) => void;
  onPrint: () => void;
  onOpenAdmin: () => void;
  /** true quando já existe uma impressora USB pareada e pronta. */
  usbConnected: boolean;
  /** abre o seletor nativo do navegador para escolher a impressora USB. */
  onConnectUsb: () => void;
  /** dispara o fluxo de impressão direta (captura -> ZPL -> USB). */
  onPrintUsb: () => void;
  /** true enquanto a captura/impressão USB está em andamento. */
  usbBusy: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  zoom,
  setZoom,
  config,
  setConfig,
  onPrint,
  onOpenAdmin,
  usbConnected,
  onConnectUsb,
  onPrintUsb,
  usbBusy,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuth();

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "preset_etiqueta_paauv.json");
    dlAnchorElem.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedConfig = JSON.parse(event.target?.result as string);
        if (importedConfig && typeof importedConfig.marca === 'string') {
          setConfig({ ...config, ...importedConfig });
          alert("Preset importado com sucesso!");
        } else {
          alert("Arquivo inválido.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo. Tem certeza que é um preset válido?");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-[60px] bg-white border-b border-slate-200 flex justify-between items-center px-6 shrink-0 z-10 print:hidden text-slate-800 font-sans shadow-sm">
      <div className="font-extrabold tracking-tight flex items-center gap-4 text-lg">
        <span className="text-rose-900">PAAUV</span> Print Studio
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 mr-2 text-slate-500 text-xs font-medium bg-slate-100 p-1 rounded-md">
          <button 
            onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
            className="text-slate-500 hover:text-slate-800 p-1 transition-colors flex items-center justify-center"
          >
            <ZoomOut size={14} />
          </button>
          <span className="w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={() => setZoom(Math.min(3, zoom + 0.2))}
            className="text-slate-500 hover:text-slate-800 p-1 transition-colors flex items-center justify-center"
          >
            <ZoomIn size={14} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
          <label className="text-slate-600 hover:text-rose-900 p-2 rounded-md transition-colors cursor-pointer" title="Importar">
            <Upload size={18} />
            <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={handleExport} className="text-slate-600 hover:text-rose-900 p-2 rounded-md transition-colors" title="Exportar">
            <Download size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === "admin" && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-md transition-colors"
            >
              <Shield size={14} />
              Gestão
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
            <User size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-700">{user?.username}</span>
            <button
              onClick={signOut}
              className="ml-2 text-slate-400 hover:text-red-600 transition-colors"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
          
          {usbConnected ? (
            <button
              onClick={onPrintUsb}
              disabled={usbBusy}
              title="Imprime direto na impressora USB, sem o diálogo do navegador"
              className="bg-emerald-700 border border-emerald-700 font-bold text-white px-4 py-2 rounded-md text-xs cursor-pointer hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {usbBusy ? <Loader2 size={16} className="animate-spin" /> : <Usb size={16} />}
              {usbBusy ? "Imprimindo..." : "Imprimir USB"}
            </button>
          ) : (
            <button
              onClick={onConnectUsb}
              title="Pareia a impressora térmica conectada via USB neste computador"
              className="bg-white border border-slate-300 font-semibold text-slate-600 px-4 py-2 rounded-md text-xs cursor-pointer hover:border-emerald-700 hover:text-emerald-700 transition-colors flex items-center gap-1.5"
            >
              <Usb size={16} />
              Conectar USB
            </button>
          )}

          <button 
            onClick={onPrint}
            className="bg-rose-900 border border-rose-900 font-bold text-white px-5 py-2 rounded-md text-xs cursor-pointer hover:bg-rose-950 transition-colors flex items-center gap-1.5 shadow-sm ml-2"
          >
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

