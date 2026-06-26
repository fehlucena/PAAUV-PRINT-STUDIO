import { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Search, 
  Tags, 
  CalendarClock, 
  Settings, 
  LogOut,
  Menu,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { user, userData, loading, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-wero-white font-impact uppercase tracking-widest animate-pulse text-wero-black">Carregando OmniBazar...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/erp' },
    { icon: PackagePlus, label: 'Triagem / Cadastro', path: '/erp/produtos/novo' },
    { icon: Search, label: 'Estoque', path: '/erp/produtos' },
    { icon: Tags, label: 'Etiquetas', path: '/erp/etiquetas' },
    { icon: Users, label: 'Voluntários', path: '/erp/voluntarios' },
  ];

  if (userData?.role === 'admin') {
    menuItems.push({ icon: Settings, label: 'Admin', path: '/erp/admin' });
  }

  return (
    <div className="flex h-screen bg-wero-grey font-classic text-wero-black overflow-hidden relative print:h-auto print:overflow-visible">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ backgroundImage: 'linear-gradient(#1D1C1C 2px, transparent 2px), linear-gradient(90deg, #1D1C1C 2px, transparent 2px)', backgroundSize: '64px 64px' }} />

      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="hidden lg:flex flex-col bg-wero-black text-wero-white border-r-4 border-wero-black relative z-20 shrink-0 print:hidden transition-all duration-300 ease-in-out"
      >
        <div className="p-6 h-24 border-b-4 border-[#333] flex items-center gap-3 overflow-hidden shrink-0">
          <div className="w-10 h-10 bg-wero-carrot border-2 border-wero-white flex flex-shrink-0 items-center justify-center organic-blob-btn shadow-[2px_2px_0_#FFFFFF]">
            <Package className="w-6 h-6 text-wero-black" />
          </div>
          {isSidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-impact font-black text-2xl uppercase tracking-tighter leading-none mt-1 whitespace-nowrap text-wero-white"
            >
              PAAUV<br/>
              <span className="text-wero-pink">OmniBazar</span>
            </motion.h1>
          )}
        </div>

        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="absolute -right-5 top-8 w-10 h-10 bg-wero-black text-wero-white border-2 border-[#333] flex items-center justify-center rounded-full z-50 hover:bg-[#333] transition-colors cursor-pointer"
        >
          {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/erp' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!isSidebarOpen ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 py-3 border-2 transition-all font-impact font-medium uppercase tracking-wider text-sm overflow-hidden whitespace-nowrap organic-blob-btn",
                  isSidebarOpen ? "px-4" : "px-0 justify-center",
                  isActive 
                    ? "bg-wero-yellow border-wero-yellow text-wero-black shadow-[3px_3px_0_#FFFFFF]" 
                    : "border-transparent text-wero-white/70 hover:bg-[#333] hover:text-wero-white hover:border-[#333]"
                )}
              >
                <Icon className={cn("shrink-0", isSidebarOpen ? "w-5 h-5" : "w-6 h-6")} />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t-4 border-[#333] flex items-center overflow-hidden shrink-0 h-24 bg-[#111]">
          <div className="w-10 h-10 rounded-full bg-wero-white text-wero-black flex items-center justify-center font-impact shrink-0 border-2 border-wero-white text-xl">
            {userData?.name?.charAt(0).toUpperCase()}
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="ml-3 flex-1 overflow-hidden"
            >
              <p className="text-sm font-bold truncate text-wero-white">{userData?.name}</p>
              <p className="text-[10px] uppercase font-impact tracking-wider text-wero-white/60">
                {userData?.role === 'admin' ? 'Admin' : 'Voluntário'}
              </p>
            </motion.div>
          )}
          {isSidebarOpen && (
            <button
              onClick={logout}
              className="p-2 ml-2 text-wero-white hover:text-wero-pink transition-colors organic-blob-btn border-2 border-transparent hover:border-wero-pink hover:bg-wero-pink/10 shrink-0"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Mobile Header (Only visible on lg-) */}
      <header className="lg:hidden bg-wero-white border-b-4 border-wero-black absolute top-0 left-0 w-full z-30 print:hidden">
        <div className="px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-wero-carrot border-2 border-wero-black flex items-center justify-center organic-blob-btn shadow-[2px_2px_0_#1D1C1C]">
              <Package className="w-6 h-6 text-wero-black" />
            </div>
            <h1 className="font-impact font-black text-2xl uppercase tracking-tighter leading-none mt-1">
              PAAUV<br/>
              <span className="text-wero-pink">OmniBazar</span>
            </h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border-2 border-wero-black bg-wero-yellow text-wero-black organic-blob-btn shadow-[2px_2px_0_#1D1C1C]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t-4 border-wero-black bg-wero-white overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/erp' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 border-2 transition-all font-impact font-medium uppercase tracking-wider text-sm my-1 organic-blob-btn",
                        isActive 
                          ? "bg-wero-yellow border-wero-black text-wero-black shadow-[2px_2px_0_#1D1C1C]" 
                          : "border-transparent text-wero-black/70 bg-wero-grey/20"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="mt-4 pt-4 border-t-2 border-wero-black/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{userData?.name}</p>
                    <p className="text-xs uppercase font-impact tracking-wider text-wero-black/60">
                      {userData?.role === 'admin' ? 'Admin' : 'Voluntário'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-wero-black bg-wero-pink text-wero-black font-impact uppercase tracking-wider text-sm organic-blob-btn shadow-[2px_2px_0_#1D1C1C]"
                  >
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 w-full h-full min-w-0 overflow-y-auto lg:pt-0 pt-20 print:overflow-visible print:h-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 print:m-0 print:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
