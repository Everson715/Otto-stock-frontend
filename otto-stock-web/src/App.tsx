import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { ROUTE_ROLES } from './types/auth';

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
import { Usuarios } from './pages/Usuarios';
import { NotFound } from './pages/NotFound';

const Landing = lazy(() => import('./pages/Landing'));

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isLandingRoute = location.pathname === '/landing';
  const showNavbar =
    isAuthenticated && location.pathname !== '/login' && !isLandingRoute;
  const WrapperTag = isLandingRoute ? 'div' : 'main';

  return (
    <>
      <Navbar />
      <WrapperTag
        className={`w-full flex-1 bg-background ${
          showNavbar ? 'pt-16' : ''
        }`}
      >
        <Routes>
          {/* Rota pública da Landing Page */}
          <Route
            path="/landing"
            element={
              <Suspense
                fallback={
                  <div
                    className="min-h-svh w-full bg-background"
                    aria-busy="true"
                  />
                }
              >
                <Landing />
              </Suspense>
            }
          />

          {/* Rota pública de autenticação */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard Geral */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/']}>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Módulo Pacientes */}
          <Route
            path="/pacientes"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/pacientes']}>
                <Pacientes />
              </ProtectedRoute>
            }
          />

          {/* Módulo Médicos */}
          <Route
            path="/medicos"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/medicos']}>
                <Medicos />
              </ProtectedRoute>
            }
          />

          {/* Módulo Atendimentos */}
          <Route
            path="/atendimentos"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/atendimentos']}>
                <Atendimentos />
              </ProtectedRoute>
            }
          />

          {/* Módulo Insumos */}
          <Route
            path="/insumos"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/insumos']}>
                <Insumos />
              </ProtectedRoute>
            }
          />

          {/* Módulo Exames */}
          <Route
            path="/exames"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/exames']}>
                <Exames />
              </ProtectedRoute>
            }
          />

          {/* Módulo Ficha Técnica (Exame - Insumos) */}
          <Route
            path="/exame-insumos"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/exame-insumos']}>
                <ExameInsumos />
              </ProtectedRoute>
            }
          />

          {/* Módulo Estoque / Movimentar */}
          <Route
            path="/estoque"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/estoque']}>
                <Estoque />
              </ProtectedRoute>
            }
          />

          {/* Módulo Estoque / Saldo Consolidado */}
          <Route
            path="/estoque/saldo"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/estoque/saldo']}>
                <EstoqueSaldo />
              </ProtectedRoute>
            }
          />

          {/* Módulo Estoque / Histórico de Movimentações */}
          <Route
            path="/estoque/movimentacoes"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/estoque/movimentacoes']}>
                <Movimentacoes />
              </ProtectedRoute>
            }
          />

          {/* Módulo Usuários / Registro de Usuários (Exclusivo ADMIN) */}
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={ROUTE_ROLES['/usuarios']}>
                <Usuarios />
              </ProtectedRoute>
            }
          />

          {/* Rota 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </WrapperTag>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster richColors position="top-right" />
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}