import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Support backwards compatibility: if they typed an email, use it directly.
    const inputVal = username.trim().toLowerCase();
    const email = inputVal.includes('@') ? inputVal : `${inputVal}@paauv.system`;
    
    // Bypass for hardcoded admin if Firebase Auth is not configured
    if (username.trim().toLowerCase() === 'admin' && password === 'admin123' && !isRegistering) {
      // Simulate login and redirect immediately
      localStorage.setItem('bypass_admin', 'true');
      setTimeout(() => {
        window.location.href = '/erp';
      }, 500);
      return;
    }

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Check if there are any other users to determine if this should be the first admin
        const q = query(collection(db, 'users'), limit(1));
        const snap = await getDocs(q);
        const isFirstUser = snap.empty; // If empty, this is the very first user ever created
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: username.trim().toLowerCase(),
          name: name || username,
          role: isFirstUser ? 'admin' : 'volunteer',
          createdAt: new Date()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/erp');
    } catch (err: any) {
      console.error(err);
      setError(isRegistering ? 'Erro ao criar conta. O usuário já existe ou a senha é muito fraca (mínimo 6 caracteres).' : 'Usuário ou senha inválidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 font-impact uppercase tracking-widest text-sm hover:text-wero-pink transition-colors z-20">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Guia
      </Link>
      
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#1D1C1C 2px, transparent 2px), linear-gradient(90deg, #1D1C1C 2px, transparent 2px)', backgroundSize: '64px 64px' }} />
      
      <div className="w-full max-w-md bg-wero-white border-2 border-wero-black shadow-wero-pink relative z-10 p-8">
        <div className="mb-8 text-center">
          <h1 className="font-impact font-black text-4xl text-wero-black tracking-tighter flex items-center justify-center gap-2 mb-2">
            <span className="w-4 h-4 bg-wero-carrot border-2 border-wero-black inline-block"></span>
            PAAUV ERP
          </h1>
          <p className="body-copy text-wero-black/70">
            {isRegistering ? 'Crie seu perfil de acesso.' : 'Acesse o sistema de gestão.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border-2 border-wero-black bg-wero-carrot text-wero-black flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <div>
              <label className="block font-impact font-bold uppercase text-xs tracking-widest mb-2">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border-2 border-wero-black bg-wero-white px-4 py-3 font-classic text-sm focus:outline-none focus:ring-0 focus:border-wero-pink transition-colors"
                placeholder="Seu nome"
              />
            </div>
          )}
          <div>
            <label className="block font-impact font-bold uppercase text-xs tracking-widest mb-2">Usuário ou E-mail</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
              required
              className="w-full border-2 border-wero-black bg-wero-white px-4 py-3 font-classic text-sm focus:outline-none focus:ring-0 focus:border-wero-pink transition-colors"
              placeholder="Ex: joao.silva ou joao@email.com"
            />
          </div>
          <div>
            <label className="block font-impact font-bold uppercase text-xs tracking-widest mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border-2 border-wero-black bg-wero-white px-4 py-3 font-classic text-sm focus:outline-none focus:ring-0 focus:border-wero-pink transition-colors"
              placeholder="•••••••• (mínimo 6 caracteres)"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-wero-black text-wero-yellow border-2 border-wero-black px-6 py-4 font-impact font-bold uppercase tracking-wider hover:bg-wero-yellow hover:text-wero-black transition-all active:translate-y-1 disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : isRegistering ? 'Criar Conta' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-sm font-impact uppercase tracking-wider text-wero-black/60 hover:text-wero-pink transition-colors underline"
          >
            {isRegistering ? 'Já tenho uma conta. Entrar.' : 'Não tem conta? Cadastre-se.'}
          </button>
        </div>
      </div>
    </div>
  );
}
