import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { LogIn } from "lucide-react";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      // Simulate username login using a dummy domain
      await signInWithEmailAndPassword(auth, `${username}@paauv.local`, password);
    } catch (err: any) {
      console.error(err);
      
      // Auto-create 'admin' account if it's the very first time trying to login
      if (username.toLowerCase() === 'admin' && password.length >= 6) {
        try {
          await createUserWithEmailAndPassword(auth, 'admin@paauv.local', password);
          return; // Success! It will auto-login.
        } catch (createErr) {
          console.error("Could not create initial admin:", createErr);
        }
      }

      setError("Usuário ou senha incorretos.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-slate-100">
        <div className="flex justify-center mb-6 text-amber-600">
          <LogIn size={48} />
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Login</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              placeholder="Digite seu usuário"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              placeholder="Digite sua senha"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors mt-2"
          >
            Entrar
          </button>
        </form>
        <p className="text-xs text-center text-slate-400 mt-6">
          Primeiro acesso? Faça login como <strong>admin</strong> e escolha uma senha.
        </p>
      </div>
    </div>
  );
}
