import React, { useState, useEffect } from "react";
import {
  CalendarClock, Trash2, X, Users, Briefcase, Plus, UserPlus, Phone, Mail, Edit, Search, MessageCircle, FileText, AlertCircle, Copy, ChevronLeft, Cake,
} from "lucide-react";
import { db } from "../lib/firebase";
import {
  collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function Voluntarios() {
  const [tab, setTab] = useState<"voluntarios" | "escalas" | "aniversarios">("voluntarios");
  const [voluntarios, setVoluntarios] = useState<any[]>([]);
  const [escalas, setEscalas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Voluntario Modal
  const [showVolModal, setShowVolModal] = useState(false);
  const [editingVolId, setEditingVolId] = useState<string | null>(null);
  const [volForm, setVolForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    areas: "",
    status: "Ativo",
    disponibilidade: "",
    observacoes: "",
    dataNascimento: "",
  });

  // Detalhes Voluntario
  const [viewVoluntario, setViewVoluntario] = useState<any | null>(null);

  // Escala Modal
  const [showEscalaModal, setShowEscalaModal] = useState(false);
  const [escalaForm, setEscalaForm] = useState({
    voluntarioId: "",
    voluntarioNome: "",
    data: "",
    turno: "Manhã",
    funcao: "Triagem",
    descricao: "",
    status: "Pendente",
  });

  // Aviso WhatsApp Modal
  const [avisoData, setAvisoData] = useState<any | null>(null);
  const [avisoCopiado, setAvisoCopiado] = useState(false);

  const fetchData = async () => {
    try {
      const qVol = query(collection(db, "voluntarios"), orderBy("nome", "asc"));
      const qEsc = query(collection(db, "escalas"), orderBy("data", "asc"));

      const [snapVol, snapEsc] = await Promise.all([
        getDocs(qVol),
        getDocs(qEsc),
      ]);

      setVoluntarios(snapVol.docs.map((d) => ({ id: d.id, ...d.data() })));
      setEscalas(snapEsc.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNewVol = () => {
    setEditingVolId(null);
    setVolForm({
      nome: "",
      email: "",
      telefone: "",
      areas: "",
      status: "Ativo",
      disponibilidade: "",
      observacoes: "",
      dataNascimento: "",
    });
    setShowVolModal(true);
  };

  const handleOpenEditVol = (v: any) => {
    setEditingVolId(v.id);
    setVolForm({
      nome: v.nome || "",
      email: v.email || "",
      telefone: v.telefone || "",
      areas: v.areas || "",
      status: v.status || "Ativo",
      disponibilidade: v.disponibilidade || "",
      observacoes: v.observacoes || "",
      dataNascimento: v.dataNascimento || "",
    });
    setShowVolModal(true);
  };

  const handleSaveVoluntario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingVolId) {
        await updateDoc(doc(db, "voluntarios", editingVolId), {
          ...volForm,
        });
      } else {
        await addDoc(collection(db, "voluntarios"), {
          ...volForm,
          dataCadastro: serverTimestamp(),
        });
      }
      setShowVolModal(false);
      await fetchData();
      if (viewVoluntario) {
        setViewVoluntario({ ...viewVoluntario, ...volForm });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoluntario = async (id: string) => {
    if (
      confirm("Tem certeza que deseja remover este voluntário permanentemente?")
    ) {
      await deleteDoc(doc(db, "voluntarios", id));
      setViewVoluntario(null);
      await fetchData();
    }
  };

  const handleSaveEscala = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const vol = voluntarios.find((v) => v.id === escalaForm.voluntarioId);
      await addDoc(collection(db, "escalas"), {
        voluntarioId: vol?.id || "",
        nome: vol?.nome || escalaForm.voluntarioNome,
        data: escalaForm.data,
        turno: escalaForm.turno,
        funcao: escalaForm.funcao,
        descricao: escalaForm.descricao,
        status: escalaForm.status,
        dataCadastro: serverTimestamp(),
      });
      setShowEscalaModal(false);
      setEscalaForm({
        voluntarioId: "",
        voluntarioNome: "",
        data: "",
        turno: "Manhã",
        funcao: "Triagem",
        descricao: "",
        status: "Pendente",
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEscalaStatus = async (id: string, novoStatus: string) => {
    try {
      await updateDoc(doc(db, "escalas", id), { status: novoStatus });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEscala = async (id: string) => {
    if (confirm("Tem certeza que deseja cancelar e excluir esta escala?")) {
      await deleteDoc(doc(db, "escalas", id));
      await fetchData();
    }
  };

  const gerarAvisoDoDia = (data: string, escalasDoDia: any[]) => {
    let texto = `🌟 *Olá equipe PAAUV!* Tudo bem com vocês?\n\nPassando para deixar o lembrete da nossa escala maravilhosa para o dia *${formatDate(data)}*:\n\n`;
    escalasDoDia.forEach((esc: any) => {
      texto += `👤 *${esc.nome}* ➔ ${esc.turno} (${esc.funcao})\n`;
    });
    texto += `\nPor favor, deem uma confirmada se está tudo certinho. Se houver qualquer imprevisto, é só nos avisar com antecedência!\n\nMuito obrigado por dedicarem o tempo de vocês para fazer a diferença! Juntos somos mais fortes! 💛🥰`;
    setAvisoData(texto);
  };

  const copiarAviso = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setAvisoCopiado(true);
    setTimeout(() => setAvisoCopiado(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const filteredVols = voluntarios.filter(
    (v) =>
      v.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.areas?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Group escalas by Date
  const escalasAgrupadas = escalas.reduce((acc: any, esc) => {
    if (!acc[esc.data]) acc[esc.data] = [];
    acc[esc.data].push(esc);
    return acc;
  }, {});

  const datasEscalas = Object.keys(escalasAgrupadas).sort();

  // Get current month birthdays
  const currentMonth = new Date().getMonth() + 1;
  const aniversariantesDoMes = voluntarios.filter((v) => {
    if (!v.dataNascimento) return false;
    const [, month] = v.dataNascimento.split("-");
    return parseInt(month) === currentMonth;
  }).sort((a, b) => {
    const dayA = parseInt(a.dataNascimento.split("-")[2]);
    const dayB = parseInt(b.dataNascimento.split("-")[2]);
    return dayA - dayB;
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-12 w-full">
      <div className="flex items-center gap-4">
        <div className="bg-wero-blue/10 p-3 rounded-lg">
          <Users className="w-8 h-8 text-wero-blue" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestão de Voluntários</h1>
      </div>

      <div className="flex border-b border-gray-200 w-full overflow-x-auto">
        <button
          onClick={() => setTab("voluntarios")}
          className={`flex-1 md:flex-none py-4 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${tab === "voluntarios" ? "border-wero-blue text-wero-blue" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Briefcase className="w-4 h-4" /> Diretório de Voluntários
          </div>
        </button>
        <button
          onClick={() => setTab("escalas")}
          className={`flex-1 md:flex-none py-4 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${tab === "escalas" ? "border-wero-blue text-wero-blue" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <div className="flex items-center justify-center gap-2">
            <CalendarClock className="w-4 h-4" /> Escalas e Tarefas
          </div>
        </button>
        <button
          onClick={() => setTab("aniversarios")}
          className={`flex-1 md:flex-none py-4 px-6 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${tab === "aniversarios" ? "border-wero-blue text-wero-blue" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Cake className="w-4 h-4" /> Aniversários
          </div>
        </button>
      </div>

      {tab === "voluntarios" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-6"
        >
          {!viewVoluntario ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 min-w-0">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <h2 className="font-semibold text-lg text-gray-900">
                  Equipe
                </h2>

                <div className="flex w-full md:w-auto gap-4">
                  <div className="relative flex-1 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar voluntário..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue transition-colors"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleOpenNewVol}
                    className="px-4 py-2 bg-wero-blue text-white rounded-lg font-medium text-sm hover:bg-wero-blue/90 transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4" /> Novo Voluntário
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                      <th className="p-4 font-medium text-xs uppercase tracking-wider">
                        Voluntário
                      </th>
                      <th className="p-4 font-medium text-xs uppercase tracking-wider hidden md:table-cell">
                        Contato
                      </th>
                      <th className="p-4 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">
                        Habilidades
                      </th>
                      <th className="p-4 font-medium text-xs uppercase tracking-wider">
                        Status
                      </th>
                      <th className="p-4 font-medium text-xs uppercase tracking-wider text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-200">
                    {filteredVols.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          Nenhum voluntário encontrado.
                        </td>
                      </tr>
                    )}
                    {filteredVols.map((v) => (
                      <tr
                        key={v.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-wero-blue/10 text-wero-blue flex items-center justify-center font-bold text-sm">
                              {v.nome?.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-medium text-gray-900">{v.nome}</div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <div className="flex flex-col gap-1 text-gray-500 text-xs">
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" /> {v.telefone || "-"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" /> {v.email || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 hidden lg:table-cell max-w-[200px] truncate text-gray-500">
                          {v.areas || "-"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full border ${v.status === "Ativo" || !v.status ? "bg-wero-green/20 text-wero-black border-wero-green/30" : "bg-gray-100 text-gray-700 border-gray-200"}`}
                          >
                            {v.status || "Ativo"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setViewVoluntario(v)}
                            className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 shadow-sm font-medium text-xs hover:bg-gray-50 transition-colors rounded-md"
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6"
            >
              <button
                onClick={() => setViewVoluntario(null)}
                className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar para Lista
              </button>

              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-wero-blue/10 text-wero-blue flex items-center justify-center font-bold text-3xl border border-wero-blue/20">
                    {viewVoluntario.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {viewVoluntario.nome}
                    </h2>
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full border ${viewVoluntario.status === "Ativo" || !viewVoluntario.status ? "bg-wero-green/20 text-wero-black border-wero-green/30" : "bg-gray-100 text-gray-700 border-gray-200"}`}
                      >
                        {viewVoluntario.status || "Ativo"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />{" "}
                        {viewVoluntario.telefone || "Não informado"}
                      </span>
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />{" "}
                        {viewVoluntario.email || "Não informado"}
                      </span>
                      {viewVoluntario.dataNascimento && (
                        <span className="flex items-center gap-2">
                          <Cake className="w-4 h-4 text-gray-400" />{" "}
                          Nascimento: {formatDate(viewVoluntario.dataNascimento)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleOpenEditVol(viewVoluntario)}
                    className="flex-1 md:flex-none px-4 py-2 bg-white text-gray-700 border border-gray-300 font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 rounded-lg shadow-sm"
                  >
                    <Edit className="w-4 h-4" /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteVoluntario(viewVoluntario.id)}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2 rounded-lg shadow-sm"
                    title="Excluir Voluntário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-200">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-gray-400" /> Perfil Profissional
                  </h3>
                  <div className="bg-gray-50 border border-gray-100 p-5 rounded-lg text-sm space-y-4">
                    <div>
                      <strong className="text-gray-500 block mb-1 font-medium">
                        Áreas de Interesse / Habilidades:
                      </strong>
                      <p className="text-gray-900">{viewVoluntario.areas || "Não informado"}</p>
                    </div>
                    <div>
                      <strong className="text-gray-500 block mb-1 font-medium">
                        Disponibilidade de Horários:
                      </strong>
                      <p className="text-gray-900">{viewVoluntario.disponibilidade || "Não informado"}</p>
                    </div>
                    <div>
                      <strong className="text-gray-500 block mb-1 font-medium">
                        Observações:
                      </strong>
                      <p className="text-gray-900">{viewVoluntario.observacoes || "-"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-gray-400" /> Histórico de Escalas
                  </h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {escalas.filter((e) => e.voluntarioId === viewVoluntario.id)
                      .length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhuma escala registrada para este voluntário.
                      </p>
                    )}
                    {escalas
                      .filter((e) => e.voluntarioId === viewVoluntario.id)
                      .sort((a, b) => b.data.localeCompare(a.data))
                      .map((esc) => (
                        <div
                          key={esc.id}
                          className="border border-gray-200 p-4 bg-white rounded-lg flex justify-between items-center shadow-sm"
                        >
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {formatDate(esc.data)} • {esc.turno}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {esc.funcao}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${esc.status === "Concluída" ? "bg-wero-green/20 text-wero-black border-wero-green/30" : esc.status === "Cancelada" ? "bg-red-50 text-red-700 border-red-200" : "bg-wero-blue/10 text-wero-blue border-wero-blue/20"}`}
                          >
                            {esc.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {tab === "escalas" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white border border-gray-200 p-6 rounded-xl shadow-sm min-w-0">
            <div>
               <h2 className="font-semibold text-lg text-gray-900 mb-1">
                 Agenda de Escalas
               </h2>
               <p className="text-sm text-gray-500">Acompanhe as escalas e dispare avisos para a equipe.</p>
            </div>
            <button
              onClick={() => setShowEscalaModal(true)}
              className="px-5 py-2.5 bg-wero-blue text-white rounded-lg font-medium text-sm hover:bg-wero-blue/90 transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Agendar Tarefa
            </button>
          </div>

          <div className="grid gap-6 min-w-0">
            {datasEscalas.length === 0 && (
              <div className="bg-white border border-gray-200 p-12 rounded-xl text-center shadow-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <CalendarClock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">
                  Nenhuma escala agendada
                </p>
                <p className="text-sm text-gray-500">Utilize o botão acima para agendar tarefas para a equipe.</p>
              </div>
            )}

            {datasEscalas.map((data) => (
              <div
                key={data}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-w-0 flex flex-col"
              >
                <div className="bg-gray-50 border-b border-gray-200 p-4 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CalendarClock className="w-5 h-5 text-wero-blue" /> 
                    <span className="font-semibold text-gray-900">{formatDate(data)}</span>
                  </div>
                  <button
                    onClick={() =>
                      gerarAvisoDoDia(data, escalasAgrupadas[data])
                    }
                    className="text-xs bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4 text-wero-green" /> Gerar Aviso do Dia
                  </button>
                </div>
                <div className="p-0 overflow-x-auto w-full">
                  <table className="w-full text-left">
                    <thead className="hidden md:table-header-group border-b border-gray-200 bg-white">
                      <tr>
                        <th className="p-4 pl-6 font-medium text-xs text-gray-500 uppercase tracking-wider">
                          Turno
                        </th>
                        <th className="p-4 font-medium text-xs text-gray-500 uppercase tracking-wider">
                          Voluntário
                        </th>
                        <th className="p-4 font-medium text-xs text-gray-500 uppercase tracking-wider">
                          Função
                        </th>
                        <th className="p-4 font-medium text-xs text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="p-4 pr-6 font-medium text-xs text-gray-500 uppercase tracking-wider text-right">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100 bg-white">
                      {escalasAgrupadas[data].map((esc: any) => (
                        <tr
                          key={esc.id}
                          className="flex flex-col md:table-row hover:bg-gray-50/50 transition-colors p-4 md:p-0"
                        >
                          <td className="md:p-4 md:pl-6 pt-2 pb-1 md:py-4">
                            <span className="font-medium text-gray-500 md:hidden mr-2">
                              Turno:
                            </span>
                            <span className="font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs">
                              {esc.turno}
                            </span>
                          </td>
                          <td className="md:p-4 py-1 font-medium text-gray-900">{esc.nome}</td>
                          <td className="md:p-4 py-1">
                            <span className="font-medium text-gray-500 md:hidden mr-2">
                              Função:
                            </span>
                            <span className="text-gray-700">{esc.funcao}</span>
                            {esc.descricao && (
                              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                                {esc.descricao}
                              </p>
                            )}
                          </td>
                          <td className="md:p-4 py-1">
                            <select
                              value={esc.status}
                              onChange={(e) =>
                                handleUpdateEscalaStatus(esc.id, e.target.value)
                              }
                              className={`text-xs font-medium uppercase tracking-wider rounded-md p-1.5 border focus:outline-none focus:ring-2 focus:ring-wero-blue/20 ${esc.status === "Concluída" ? "bg-wero-green/20 text-wero-black border-wero-green/30" : esc.status === "Cancelada" ? "bg-red-50 text-red-700 border-red-200" : "bg-wero-blue/10 text-wero-blue border-wero-blue/20"}`}
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Confirmada">Confirmada</option>
                              <option value="Concluída">Concluída</option>
                              <option value="Cancelada">
                                Falta / Cancelada
                              </option>
                            </select>
                          </td>
                          <td className="md:p-4 md:pr-6 pt-3 md:py-4 text-left md:text-right flex items-center md:justify-end gap-2">
                            <button
                              onClick={() => handleDeleteEscala(esc.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir Escala"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === "aniversarios" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-6"
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 min-w-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
              <div>
                 <h2 className="font-semibold text-xl text-gray-900 flex items-center gap-2 mb-1">
                   <Cake className="w-6 h-6 text-wero-violet" /> Aniversariantes do Mês
                 </h2>
                 <p className="text-sm text-gray-500">Comemore com a equipe os aniversários de {new Date().toLocaleString('pt-BR', { month: 'long' })}.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aniversariantesDoMes.length === 0 && (
                <div className="col-span-full p-12 text-center border border-dashed border-gray-200 rounded-xl flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                     <Cake className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-900 mb-1">
                    Nenhum aniversariante neste mês.
                  </p>
                </div>
              )}
              {aniversariantesDoMes.map(v => (
                <div key={v.id} className="border border-gray-100 p-5 bg-gray-50/50 hover:bg-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm transition-colors hover:shadow-md">
                  <div className="w-16 h-16 rounded-full bg-wero-violet/10 text-wero-violet flex items-center justify-center font-bold text-2xl shrink-0 border border-wero-violet/20">
                    {v.dataNascimento.split("-")[2]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-0.5 truncate">{v.nome}</h3>
                    <p className="text-sm text-gray-500 mb-3 truncate">
                      Dia {v.dataNascimento.split("-")[2]} de {new Date(v.dataNascimento).toLocaleString('pt-BR', { month: 'long' })}
                    </p>
                    <a href={`https://wa.me/55${v.telefone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-xs font-medium bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 hover:bg-wero-green/20 hover:text-gray-900 hover:border-wero-green/30 transition-colors shadow-sm">
                      <MessageCircle className="w-3.5 h-3.5" /> Dar Parabéns
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Add/Edit Voluntario Modal */}
      <AnimatePresence>
        {showVolModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xl w-full max-w-2xl relative my-8"
            >
              <button
                onClick={() => setShowVolModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingVolId ? "Editar Voluntário" : "Novo Voluntário"}
              </h2>

              <form onSubmit={handleSaveVoluntario} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      required
                      type="text"
                      value={volForm.nome}
                      onChange={(e) =>
                        setVolForm({ ...volForm, nome: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      required
                      type="text"
                      value={volForm.telefone}
                      onChange={(e) =>
                        setVolForm({ ...volForm, telefone: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={volForm.email}
                      onChange={(e) =>
                        setVolForm({ ...volForm, email: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={volForm.dataNascimento}
                      onChange={(e) =>
                        setVolForm({ ...volForm, dataNascimento: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={volForm.status}
                      onChange={(e) =>
                        setVolForm({ ...volForm, status: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Áreas de Interesse / Habilidades
                  </label>
                  <input
                    type="text"
                    value={volForm.areas}
                    onChange={(e) =>
                      setVolForm({ ...volForm, areas: e.target.value })
                    }
                    placeholder="Ex: Triagem, Fotografia, Atendimento..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disponibilidade
                  </label>
                  <input
                    type="text"
                    value={volForm.disponibilidade}
                    onChange={(e) =>
                      setVolForm({
                        ...volForm,
                        disponibilidade: e.target.value,
                      })
                    }
                    placeholder="Ex: Segundas e Quartas, Tarde..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações Extras
                  </label>
                  <textarea
                    rows={3}
                    value={volForm.observacoes}
                    onChange={(e) =>
                      setVolForm({ ...volForm, observacoes: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue resize-none"
                    placeholder="Informações adicionais..."
                  />
                </div>

                <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowVolModal(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-wero-blue rounded-lg hover:bg-wero-blue/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? "Salvando..." : "Salvar Voluntário"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Escala Modal */}
      <AnimatePresence>
        {showEscalaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xl w-full max-w-md relative my-8"
            >
              <button
                onClick={() => setShowEscalaModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Agendar Tarefa
              </h2>

              <form onSubmit={handleSaveEscala} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voluntário *
                  </label>
                  <select
                    required
                    value={escalaForm.voluntarioId}
                    onChange={(e) =>
                      setEscalaForm({
                        ...escalaForm,
                        voluntarioId: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                  >
                    <option value="">Selecione um Voluntário...</option>
                    {voluntarios
                      .filter((v) => v.status === "Ativo")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nome}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data *
                    </label>
                    <input
                      required
                      type="date"
                      value={escalaForm.data}
                      onChange={(e) =>
                        setEscalaForm({ ...escalaForm, data: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Turno *
                    </label>
                    <select
                      required
                      value={escalaForm.turno}
                      onChange={(e) =>
                        setEscalaForm({ ...escalaForm, turno: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Integral">Integral</option>
                      <option value="Noite">Noite / Evento</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função/Tarefa Principal *
                  </label>
                  <select
                    required
                    value={escalaForm.funcao}
                    onChange={(e) =>
                      setEscalaForm({ ...escalaForm, funcao: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue"
                  >
                    <option value="Triagem">
                      Triagem (Avaliação e Precificação)
                    </option>
                    <option value="Fotografia">
                      Fotografia para E-commerce
                    </option>
                    <option value="Estoque">Organização de Estoque</option>
                    <option value="Atendimento">Atendimento Presencial</option>
                    <option value="Logistica">Logística e Entregas</option>
                    <option value="Marketing">Marketing / Redes Sociais</option>
                    <option value="Outro">Outro...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detalhes / Instruções (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={escalaForm.descricao}
                    onChange={(e) =>
                      setEscalaForm({
                        ...escalaForm,
                        descricao: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wero-blue/20 focus:border-wero-blue resize-none"
                    placeholder="Ex: Focar na caixa de doações de inverno..."
                  />
                </div>
                <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEscalaModal(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-wero-blue rounded-lg hover:bg-wero-blue/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? "Agendando..." : "Confirmar Agenda"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aviso Message Modal */}
      <AnimatePresence>
        {avisoData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xl w-full max-w-md relative"
            >
              <button
                onClick={() => setAvisoData(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-emerald-500" /> Aviso WhatsApp
              </h2>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed mb-6">
                {avisoData}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setAvisoData(null)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Fechar
                </button>
                <button
                  onClick={() => copiarAviso(avisoData)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-wero-green border border-wero-green/30 rounded-lg hover:bg-wero-green/80 transition-colors shadow-sm flex items-center gap-2"
                >
                  {avisoCopiado ? (
                    <>
                      <Copy className="w-4 h-4" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar Texto
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
