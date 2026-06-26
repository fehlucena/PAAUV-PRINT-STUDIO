import React, { useRef } from 'react';
import { Download, Upload, Printer, ZoomIn, ZoomOut, User, LogOut, Shield } from 'lucide-react';
import { LabelConfig } from '../types';
import { useAuth } from '../lib/AuthContext';

interface TopBarProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  config: LabelConfig;
  setConfig: (config: LabelConfig) => void;
  onPrint: () => void;
  onOpenAdmin: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ zoom, setZoom, config, setConfig, onPrint, onOpenAdmin }) => {
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
        <span className="text-amber-600">PAAUV</span> Print Studio
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
          <label className="text-slate-600 hover:text-amber-600 p-2 rounded-md transition-colors cursor-pointer" title="Importar">
            <Upload size={18} />
            <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={handleExport} className="text-slate-600 hover:text-amber-600 p-2 rounded-md transition-colors" title="Exportar">
            <Download size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === "admin" && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-md transition-colors"
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
          
          <button 
            onClick={onPrint}
            className="bg-amber-600 border border-amber-600 font-bold text-white px-5 py-2 rounded-md text-xs cursor-pointer hover:bg-amber-700 transition-colors flex items-center gap-1.5 shadow-sm ml-2"
          >
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

