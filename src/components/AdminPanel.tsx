import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";
import firebaseConfig from "../../firebase-applet-config.json";
import { UserPlus, Trash2, ArrowLeft, Shield } from "lucide-react";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";

// Initialize a secondary app just for creating users so it doesn't log the admin out
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = async () => {
    const path = "users";
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList: any[] = [];
      querySnapshot.forEach((doc) => {
        userList.push(doc.data());
      });
      setUsers(userList);
    } catch (err: any) {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (jsonErr: any) {
        const info = JSON.parse(jsonErr.message);
        setError(`Erro de permissão: Você não tem acesso a esta lista. (UID: ${info.authInfo.userId})`);
      }
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      // Create user using the secondary auth instance
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        `${newUsername}@paauv.local`,
        newPassword
      );
      
      const newUser = {
        uid: userCredential.user.uid,
        username: newUsername,
        role: role
      };

      // Save user to Firestore
      const path = `users/${newUser.uid}`;
      try {
        await setDoc(doc(db, "users", newUser.uid), newUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      
      setSuccess(`Usuário ${newUsername} criado com sucesso!`);
      setNewUsername("");
      setNewPassword("");
      loadUsers();

      // Sign out the secondary instance just to clean up
      await secondaryAuth.signOut();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
         setError("Este usuário já existe.");
      } else {
         setError("Erro ao criar usuário.");
      }
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário? Isso não remove a conta do Auth, apenas do painel e revoga acesso.")) {
      const path = `users/${uid}`;
      try {
        await deleteDoc(doc(db, "users", uid));
        loadUsers();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-white rounded-full shadow hover:bg-slate-100 transition-colors"
              title="Voltar"
            >
              <ArrowLeft size={20} className="text-slate-700" />
            </button>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Shield className="text-rose-900" />
              Gestão de Usuários
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus size={18} />
              Novo Usuário
            </h2>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm mb-4">{success}</div>}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-rose-900"
                  placeholder="Apenas letras e números"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-rose-900"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Permissão</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "user")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-rose-900 bg-white"
                >
                  <option value="user">Usuário Padrão</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-800 text-white py-2 rounded-md font-medium hover:bg-slate-900 transition-colors pt-2 mt-2"
              >
                Criar Usuário
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Usuário</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600">Permissão</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.uid} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-800 font-medium">{u.username}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-rose-100 text-rose-900' : 'bg-blue-100 text-blue-800'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.uid)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Excluir (apenas do painel)"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
