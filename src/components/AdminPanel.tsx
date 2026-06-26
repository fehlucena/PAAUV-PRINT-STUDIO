import { useState, useEffect, FormEvent } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Settings, Shield, Users, Edit2, X, Check, UserPlus, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function AdminPanel() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [voluntarios, setVoluntarios] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Volunteer form
  const [volNome, setVolNome] = useState('');
  const [volEmail, setVolEmail] = useState('');
  const [volTelefone, setVolTelefone] = useState('');
  const [volSuccess, setVolSuccess] = useState(false);

  const fetchUsers = async () => {
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setUsers(docs);
  };

  const fetchVoluntarios = async () => {
    const q = query(collection(db, 'voluntarios'));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setVoluntarios(docs);
  };

  useEffect(() => {
    fetchUsers();
    fetchVoluntarios();
  }, []);

  const handleUpdateRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        role: editingUser.role
      });
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVoluntario = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'voluntarios'), {
        nome: volNome,
        email: volEmail,
        telefone: volTelefone,
        dataCadastro: serverTimestamp()
      });
      setVolSuccess(true);
      setVolNome('');
      setVolEmail('');
      setVolTelefone('');
      await fetchVoluntarios();
      setTimeout(() => setVolSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar voluntário.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoluntario = async (id: string) => {
    if (confirm('Deseja remover este voluntário do cadastro?')) {
      try {
        await deleteDoc(doc(db, 'voluntarios', id));
        await fetchVoluntarios();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (userData?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-wero-carrot" />
        <h2 className="impact-headline text-3xl">Acesso Negado</h2>
        <p className="body-copy">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-wero-black border-2 border-wero-black shadow-[4px_4px_0_#1D1C1C] organic-blob-btn">
          <Settings className="w-8 h-8 text-wero-yellow" />
        </div>
        <h1 className="impact-headline text-4xl">Painel Administrativo</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gestão de Voluntários */}
        <div className="bg-wero-white border-2 border-wero-black shadow-[4px_4px_0_#1D1C1C] p-6 organic-card">
          <h2 className="font-impact font-bold uppercase text-xl mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Cadastro de Voluntários
          </h2>
          
          {volSuccess && (
            <div className="mb-6 p-4 border-2 border-wero-black bg-wero-green flex items-center gap-3 organic-card">
              <Check className="shrink-0" />
              <p className="font-impact font-bold uppercase tracking-wider text-sm">Voluntário cadastrado!</p>
            </div>
          )}

          <form onSubmit={handleAddVoluntario} className="space-y-4 mb-8 border-b-2 border-wero-black pb-8">
            <div>
              <label className="block font-impact font-bold uppercase text-xs tracking-widest mb-1 opacity-70">Nome Completo</label>
              <input required type="text" value={volNome} onChange={(e: any)=>setVolNome(e.target.value)} className="w-full border-2 border-wero-black p-2 bg-wero-grey/20 focus:bg-wero-yellow/20 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-impact font-bold uppercase text-xs tracking-widest mb-1 opacity-70">Email</label>
                <input type="email" value={volEmail} onChange={(e: any)=>setVolEmail(e.target.value)} className="w-full border-2 border-wero-black p-2 bg-wero-grey/20 focus:bg-wero-yellow/20 outline-none" />
              </div>
              <div>
                <label className="block font-impact font-bold uppercase text-xs tracking-widest mb-1 opacity-70">Telefone</label>
                <input type="text" value={volTelefone} onChange={(e: any)=>setVolTelefone(e.target.value)} className="w-full border-2 border-wero-black p-2 bg-wero-grey/20 focus:bg-wero-yellow/20 outline-none" />
              </div>
            </div>
            <button disabled={loading} type="submit" className="w-full py-3 bg-wero-black text-wero-yellow border-2 border-wero-black font-impact uppercase hover:bg-wero-carrot hover:text-wero-black transition-colors organic-blob-btn mt-2">
              Cadastrar Voluntário
            </button>
          </form>

          <h3 className="font-impact font-bold uppercase text-sm mb-4 opacity-70">Voluntários Cadastrados</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {voluntarios.length === 0 ? <p className="opacity-60 text-sm">Nenhum voluntário.</p> : null}
            {voluntarios.map(v => (
              <div key={v.id} className="p-3 border-2 border-wero-black bg-wero-white flex justify-between items-center organic-card">
                <div>
                  <div className="font-bold">{v.nome}</div>
                  <div className="text-xs opacity-60 font-mono">{v.email || 'Sem email'} · {v.telefone || 'Sem tel'}</div>
                </div>
                <button onClick={() => handleDeleteVoluntario(v.id)} className="p-2 hover:bg-wero-pink transition-colors rounded-full"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Gestão de Acessos de Usuários do Sistema */}
        <div className="bg-wero-white border-2 border-wero-black shadow-[4px_4px_0_#1D1C1C] p-6 organic-card">
          <h2 className="font-impact font-bold uppercase text-xl mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Permissões de Acesso (Login)
          </h2>
          <p className="text-sm opacity-70 mb-4 border-l-4 border-wero-carrot pl-3 py-1 bg-wero-carrot/10">
            Usuários que criaram conta no sistema via tela de Login. Aqui você define quem é Administrador ou Voluntário.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-wero-grey border-b-2 border-wero-black font-impact font-bold uppercase text-xs tracking-wider">
                  <th className="p-3">Nome / Usuário</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody className="font-classic text-sm">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-wero-black/60">
                      Buscando usuários...
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="border-b border-wero-black/10 hover:bg-wero-yellow/10 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-xs opacity-60">@{u.username || u.email}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-wero-carrot text-wero-black border border-wero-black' : 'bg-wero-black text-wero-yellow'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Voluntário'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => setEditingUser(u)}
                          className="text-xs font-impact uppercase underline hover:text-wero-pink flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-wero-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-wero-white border-2 border-wero-black shadow-wero-pink p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-impact font-bold uppercase text-xl">Editar Acesso</h3>
              <button onClick={() => setEditingUser(null)} className="hover:text-wero-carrot">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <p className="font-semibold">{editingUser.name}</p>
                <p className="text-sm text-wero-black/60">@{editingUser.username}</p>
              </div>
              
              <div>
                <label className="block font-impact font-bold uppercase text-xs tracking-widest mb-2">Cargo do Usuário</label>
                <select
                  value={editingUser.role}
                  onChange={(e: any) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full border-2 border-wero-black bg-wero-white px-4 py-3 font-classic text-sm focus:outline-none focus:ring-0 focus:border-wero-pink transition-colors appearance-none rounded-none"
                >
                  <option value="volunteer">Voluntário (Acesso Restrito)</option>
                  <option value="admin">Administrador (Acesso Total)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-wero-black text-wero-yellow border-2 border-wero-black px-6 py-3 font-impact font-bold uppercase tracking-wider hover:bg-wero-yellow hover:text-wero-black transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
