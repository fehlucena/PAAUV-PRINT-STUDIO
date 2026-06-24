import { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LabelPreview } from './components/LabelPreview';
import { defaultConfig, LabelConfig } from './types';

export default function App() {
  const [config, setConfig] = useState<LabelConfig>(defaultConfig);
  const [zoom, setZoom] = useState(1.2);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (window.self !== window.top) {
      alert("Aviso: A impressão direta pode ser bloqueada nesta visualização.\nPara garantir a impressão correta, abra o app em uma NOVA GUIA clicando no botão (ícone de seta) no canto superior direito e tente novamente.");
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden text-slate-800 font-sans print:h-auto print:bg-white print:overflow-visible">
      <div className="print:hidden">
        <TopBar 
          zoom={zoom} 
          setZoom={setZoom} 
          config={config} 
          setConfig={setConfig} 
          onPrint={handlePrint} 
        />
      </div>
      
      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        <div className="print:hidden h-full shrink-0">
          <Sidebar config={config} setConfig={setConfig} />
        </div>
        
        <div 
          className="flex-grow bg-slate-200 flex justify-center items-center overflow-auto relative print:hidden"
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {/* We wrap the Canvas in a container that transforms in screen mode but resets in print mode */}
          <div 
            className="bg-white shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] origin-center transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="absolute -top-7 left-0 w-full text-center text-xs font-bold text-slate-500 uppercase tracking-wider print:hidden">
              Tamanho Real ({config.width}mm x {config.height}mm)
            </div>
            <LabelPreview config={config} />
          </div>
        </div>

        {/* PRINT ONLY CONTAINER */}
        <div className="hidden print:block absolute top-0 left-0 m-0 p-0 overflow-visible bg-white z-50">
          <LabelPreview config={config} />
        </div>
      </div>
    </div>
  );
}
