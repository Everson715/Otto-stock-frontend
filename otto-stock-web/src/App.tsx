import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';

import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Insumos } from './pages/Insumos';
import { Exames } from './pages/Exames';
import { Estoque } from './pages/Estoque';
import { Atendimentos } from './pages/Atendimentos';
import { Movimentacoes } from './pages/Movimentacoes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <Navbar />

        <Routes>
          {/* Rota pública de autenticação */}
          <Route path="/login" element={<Login />} />

          {/* Rotas de negócio protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insumos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ESTOQUISTA']}>
                <Insumos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exames"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Exames />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estoque"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ESTOQUISTA']}>
                <Estoque />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estoque/movimentacoes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ESTOQUISTA', 'GESTOR']}>
                <Movimentacoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/atendimentos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ATENDENTE', 'GESTOR']}>
                <Atendimentos />
              </ProtectedRoute>
            }
          />

          {/* Redirecionamento padrão */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}