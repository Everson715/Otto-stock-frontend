import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';

import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Pacientes } from './pages/Pacientes';
import { Medicos } from './pages/Medicos';
import { Atendimentos } from './pages/Atendimentos';
import { Insumos } from './pages/Insumos';
import { Exames } from './pages/Exames';
import { ExameInsumos } from './pages/ExameInsumos';
import { Estoque } from './pages/Estoque';
import { EstoqueSaldo } from './pages/EstoqueSaldo';
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

          {/* Dashboard Geral */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Módulo Pacientes */}
          <Route
            path="/pacientes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ATENDENTE', 'GESTOR']}>
                <Pacientes />
              </ProtectedRoute>
            }
          />

          {/* Módulo Médicos */}
          <Route
            path="/medicos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'GESTOR']}>
                <Medicos />
              </ProtectedRoute>
            }
          />

          {/* Módulo Atendimentos */}
          <Route
            path="/atendimentos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ATENDENTE', 'GESTOR']}>
                <Atendimentos />
              </ProtectedRoute>
            }
          />

          {/* Módulo Insumos */}
          <Route
            path="/insumos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ESTOQUISTA']}>
                <Insumos />
              </ProtectedRoute>
            }
          />

          {/* Módulo Exames */}
          <Route
            path="/exames"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Exames />
              </ProtectedRoute>
            }
          />

          {/* Módulo Ficha Técnica (Exame - Insumos) */}
          <Route
            path="/exame-insumos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ESTOQUISTA']}>
                <ExameInsumos />
              </ProtectedRoute>
            }
          />

          {/* Módulo Estoque / Movimentar */}
          <Route
            path="/estoque"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ESTOQUISTA']}>
                <Estoque />
              </ProtectedRoute>
            }
          />

          {/* Módulo Estoque / Saldo Consolidado */}
          <Route
            path="/estoque/saldo"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ESTOQUISTA', 'GESTOR']}>
                <EstoqueSaldo />
              </ProtectedRoute>
            }
          />

          {/* Módulo Estoque / Histórico de Movimentações */}
          <Route
            path="/estoque/movimentacoes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ESTOQUISTA', 'GESTOR']}>
                <Movimentacoes />
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