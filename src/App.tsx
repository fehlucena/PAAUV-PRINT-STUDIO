import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProdutoForm from './components/ProdutoForm';
import ProdutosList from './components/ProdutosList';
import Etiquetas from './components/Etiquetas';
import Voluntarios from './components/Voluntarios';
import AdminPanel from './components/AdminPanel';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/erp" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/erp" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<ProdutosList />} />
            <Route path="produtos/novo" element={<ProdutoForm />} />
            <Route path="etiquetas" element={<Etiquetas />} />
            <Route path="voluntarios" element={<Voluntarios />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
          <Route path="*" element={<Navigate to="/erp" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
