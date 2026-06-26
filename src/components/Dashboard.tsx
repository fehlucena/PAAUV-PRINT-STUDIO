import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Package, Users, Tag, TrendingUp, BarChart2, Cake } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, onSnapshot, where } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm flex flex-col justify-between">
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-medium text-sm text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    <div>
      <p className="font-semibold text-3xl text-gray-900">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { userData } = useAuth();
  
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [recentes, setRecentes] = useState<any[]>([]);
  const [etiquetasHoje, setEtiquetasHoje] = useState(0);
  const [voluntariosCount, setVoluntariosCount] = useState(0);
  const [escalasHoje, setEscalasHoje] = useState<any[]>([]);
  const [aniversariantesMes, setAniversariantesMes] = useState<any[]>([]);
  const [nivelData, setNivelData] = useState<any[]>([]);

  useEffect(() => {
    // Escutar produtos (para total, valor e atividades recentes)
    const qProdutos = query(collection(db, 'produtos'), orderBy('dataCadastro', 'desc'));
    const unsubscribeProdutos = onSnapshot(qProdutos, (snapshot) => {
      let count = 0;
      let val = 0;
      const rec: any[] = [];
      let todayCount = 0;
      const nivelCounts: Record<string, number> = {};
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      snapshot.docs.forEach((doc, idx) => {
        const d = doc.data();
        count++;
        val += (Number(d.preco) || 0);
        
        if (idx < 5) {
          rec.push({ id: doc.id, ...d });
        }
        
        if (d.dataCadastro) {
          const dt = d.dataCadastro.toDate();
          if (dt >= today) todayCount++;
        }

        const nivel = d.nivel || 'Desconhecido';
        nivelCounts[nivel] = (nivelCounts[nivel] || 0) + 1;
      });
      
      const chartData = Object.keys(nivelCounts).map(key => ({
        name: key,
        quantidade: nivelCounts[key]
      })).sort((a, b) => b.quantidade - a.quantidade);

      setTotalProdutos(count);
      setValorTotal(val);
      setRecentes(rec);
      setEtiquetasHoje(todayCount);
      setNivelData(chartData);
    });
    
    // Voluntários ativos e Aniversariantes
    const fetchVoluntarios = async () => {
      const qVol = query(collection(db, 'voluntarios'));
      const snapshot = await getDocs(qVol);
      
      const vols = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setVoluntariosCount(vols.length);
      
      const currentMonth = new Date().getMonth() + 1;
      const anivs = vols.filter((v: any) => {
        if (!v.dataNascimento) return false;
        const [, month] = v.dataNascimento.split("-");
        return parseInt(month) === currentMonth;
      }).sort((a: any, b: any) => {
        const dayA = parseInt(a.dataNascimento.split("-")[2]);
        const dayB = parseInt(b.dataNascimento.split("-")[2]);
        return dayA - dayB;
      });
      setAniversariantesMes(anivs);
    };
    fetchVoluntarios();

    // Escalas de Hoje
    const todayStr = new Date().toISOString().split('T')[0];
    const qEscala = query(collection(db, 'escalas'), where('data', '==', todayStr));
    const unsubscribeEscala = onSnapshot(qEscala, (snapshot) => {
      setEscalasHoje(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeProdutos();
      unsubscribeEscala();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 w-full min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">Visão Geral</h1>
        <p className="text-gray-500">
          Bem-vindo de volta ao <span className="font-semibold text-gray-900">PAAUV OmniBazar</span>, <span className="font-semibold text-wero-blue">{userData?.name}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Produtos" value={totalProdutos} icon={Package} colorClass="bg-wero-blue/10 text-wero-blue" />
        <StatCard title="Entradas Hoje" value={etiquetasHoje} icon={Tag} colorClass="bg-wero-pink/10 text-wero-pink" />
        <StatCard title="Voluntários" value={voluntariosCount} icon={Users} colorClass="bg-wero-green/20 text-wero-black" />
        <StatCard title="Valor Estimado" value={`R$ ${valorTotal.toFixed(2).replace('.', ',')}`} icon={TrendingUp} colorClass="bg-wero-yellow/20 text-wero-black" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-w-0">
        {/* Chart */}
        <div className="lg:col-span-3 bg-white border border-gray-200 p-6 rounded-xl shadow-sm min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-lg text-gray-900">Distribuição por Nível de Preço</h2>
          </div>
          <div className="h-72 w-full min-w-0">
            {nivelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nivelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip 
                    cursor={{ fill: '#F3F4F6' }} 
                    contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="quantidade" fill="#3F89FD" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Sem dados suficientes
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
        {/* Escala Hoje */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm min-w-0">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-lg text-gray-900">Escala de Hoje</h2>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
            {escalasHoje.length === 0 ? (
              <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center text-gray-500">
                <p className="text-sm">Nenhum voluntário escalado para hoje.</p>
              </div>
            ) : (
              escalasHoje.map((escala) => (
                <div key={escala.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">{escala.nome}</span>
                    <span className="text-xs text-gray-500">{escala.funcao}</span>
                  </div>
                  <span className="text-xs font-medium bg-wero-blue/10 text-wero-blue px-2.5 py-1 rounded-full border border-wero-blue/20">
                    {escala.turno}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Aniversariantes */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm min-w-0">
          <div className="flex items-center gap-2 mb-6">
            <Cake className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-lg text-gray-900">Aniversariantes do Mês</h2>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
            {aniversariantesMes.length === 0 ? (
              <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center text-gray-500">
                <p className="text-sm">Nenhum aniversariante neste mês.</p>
              </div>
            ) : (
              aniversariantesMes.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-wero-violet/10 text-wero-violet flex items-center justify-center font-bold text-sm border border-wero-violet/20 shrink-0">
                       {v.dataNascimento.split("-")[2]}
                     </div>
                     <div className="min-w-0">
                       <span className="font-medium text-gray-900 block truncate">{v.nome}</span>
                       <span className="text-xs text-gray-500 truncate">{v.telefone || v.email || 'Sem contato'}</span>
                     </div>
                  </div>
                  <span className="text-xs font-medium bg-white text-gray-600 px-2.5 py-1 rounded-full border border-gray-200 shadow-sm shrink-0">
                    Dia {v.dataNascimento.split("-")[2]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm min-w-0">
        <h2 className="font-semibold text-lg text-gray-900 mb-6">Últimos Cadastros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {recentes.length === 0 && <p className="text-sm text-gray-500 col-span-5">Nenhum produto cadastrado.</p>}
          {recentes.map((prod) => (
            <div key={prod.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col justify-between hover:border-wero-blue/40 transition-colors min-w-0">
              <div>
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-3">
                  <Package className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{prod.nome}</p>
                <p className="text-xs text-gray-500 font-mono">{prod.codigo || 'S/N'}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500 truncate">{prod.nivel}</span>
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">R$ {prod.preco}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
