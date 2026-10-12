import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Perfil } from '../types/auth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from './ui/Button';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: Perfil[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, perfil } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin size-8 text-blue-500" />
        <span className="text-sm text-gray-500">Verificando sessão...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && perfil && perfil !== 'ADMIN' && !allowedRoles.includes(perfil)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
        <ShieldAlert className="size-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-800">Acesso Restrito</h2>
        <p className="text-sm text-gray-600 max-w-md text-center">
          Seu perfil ({perfil}) não possui permissão para acessar esta seção do sistema.
        </p>
        <Button onClick={() => window.location.href = '/'}>Voltar ao Início</Button>
      </div>
    );
  }

  return <>{children}</>;
}
