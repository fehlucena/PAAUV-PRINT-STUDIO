import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { LabelPreview } from "./components/LabelPreview";
import { defaultConfig, LabelConfig } from "./types";

export default function App() {
  const [config, setConfig] = useState<LabelConfig>(defaultConfig);
  const [zoom, setZoom] = useState(1.2);

  useEffect(() => {
    const defaultPreset = localStorage.getItem('paauv-default-preset');
    if (defaultPreset) {
      try {
        const parsed = JSON.parse(defaultPreset);
        if (parsed && typeof parsed.marca === 'string') {
          setConfig(parsed);
        }
      } catch (e) {}
    }
  }, []);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const updateConfig = (key: keyof LabelConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page {
            size: ${config.width}mm ${config.height}mm;
            margin: 0;
          }
        `}
      </style>

      {/* SCREEN LAYOUT */}
      <div className="h-screen flex flex-col bg-slate-100 overflow-hidden text-slate-800 font-sans print:hidden">
        <TopBar
          zoom={zoom}
          setZoom={setZoom}
          config={config}
          setConfig={setConfig}
          onPrint={handlePrint}
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="h-full shrink-0">
            <Sidebar 
              config={config} 
              setConfig={setConfig} 
            />
          </div>

          <div
            className="flex-grow bg-slate-200 flex justify-center items-center overflow-auto relative"
            style={{
              backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <div
              className="absolute inset-0 flex justify-center items-center overflow-auto pointer-events-none"
            >
              <div
                className="bg-white shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] origin-center transition-transform duration-200 ease-out pointer-events-auto relative"
                style={{ transform: `scale(${zoom})` }}
              >
                <div className="absolute -top-7 left-0 w-full text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tamanho Real ({config.width}mm x {config.height}mm)
                </div>
                <LabelPreview config={config} updateConfig={updateConfig} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT ONLY CONTAINER */}
      <div className="hidden print:block m-0 p-0 bg-white font-sans text-black">
        <LabelPreview config={config} />
      </div>
    </>
  );
}
