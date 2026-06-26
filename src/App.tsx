import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { LabelPreview } from "./components/LabelPreview";
import { defaultConfig, LabelConfig } from "./types";
import { loadDefaultPresetFromDB } from "./lib/presets";
import { useAuth } from "./lib/AuthContext";
import { Login } from "./components/Login";
import { AdminPanel } from "./components/AdminPanel";
import { Loader2 } from "lucide-react";

export default function App() {
  const { user, loading } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [config, setConfig] = useState<LabelConfig>(defaultConfig);
  const [zoom, setZoom] = useState(1.2);

  useEffect(() => {
    const fetchDefaultPreset = async () => {
      if (!user) return;
      const defaultPreset = await loadDefaultPresetFromDB(user.uid);
      if (defaultPreset && typeof defaultPreset.marca === 'string') {
        setConfig(defaultPreset);
      }
    };
    fetchDefaultPreset();
  }, [user]);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const updateConfig = (key: keyof LabelConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-amber-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (showAdmin && user.role === "admin") {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

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
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden text-slate-800 font-sans print:hidden">
        <TopBar
          zoom={zoom}
          setZoom={setZoom}
          config={config}
          setConfig={setConfig}
          onPrint={handlePrint}
          onOpenAdmin={() => setShowAdmin(true)}
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="h-full shrink-0 border-r border-slate-200 bg-white">
            <Sidebar 
              config={config} 
              setConfig={setConfig} 
            />
          </div>

          <div
            className="flex-grow bg-slate-100 flex justify-center items-center overflow-auto relative"
            style={{
              backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <div
              className="absolute inset-0 flex justify-center items-center overflow-auto pointer-events-none"
            >
              <div
                className="bg-white shadow-2xl rounded-sm origin-center transition-transform duration-200 ease-out pointer-events-auto relative"
                style={{ transform: `scale(${zoom})` }}
              >
                <div className="absolute -top-8 left-0 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {config.width}mm x {config.height}mm
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
