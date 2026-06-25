import React, { useRef } from 'react';
import { Download, Upload, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { LabelConfig } from '../types';

interface TopBarProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  config: LabelConfig;
  setConfig: (config: LabelConfig) => void;
  onPrint: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ zoom, setZoom, config, setConfig, onPrint }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="h-[55px] bg-white border-b border-slate-200 flex justify-between items-center px-6 shrink-0 z-10 print:hidden text-slate-800 font-sans shadow-sm">
      <div className="font-extrabold tracking-tight flex items-center gap-4 text-lg">
        PAAUV Print Studio
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 mr-2 text-slate-500 text-xs font-medium">
          Zoom:
          <button 
            onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
            className="bg-slate-50 border border-slate-200 text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors flex items-center justify-center w-7 h-7"
          >
            <ZoomOut size={14} />
          </button>
          <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={() => setZoom(Math.min(3, zoom + 0.2))}
            className="bg-slate-50 border border-slate-200 text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors flex items-center justify-center w-7 h-7"
          >
            <ZoomIn size={14} />
          </button>
        </div>
        
        <label className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm">
          <Upload size={14} />
          Importar JSON
          <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImport} />
        </label>
        
        <button 
          onClick={handleExport}
          className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Download size={14} />
          Exportar JSON
        </button>
        
        <button 
          onClick={onPrint}
          className="bg-amber-600 border border-amber-600 font-bold text-white px-5 py-2 rounded-md text-xs cursor-pointer hover:bg-amber-700 transition-colors flex items-center gap-1.5 shadow-sm ml-2"
        >
          <Printer size={14} />
          Imprimir Etiquetas
        </button>
      </div>
    </div>
  );
};

