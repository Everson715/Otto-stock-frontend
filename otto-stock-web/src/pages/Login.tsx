import { useLocation, Navigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import pkg from '../../package.json';
import { useAuth } from '../contexts/AuthContext';
import {
  getDefaultRouteForPerfil,
  hasRouteAccess,
  ROUTE_ROLES,
  type AppRoutePath,
} from '../types/auth';
import { LoginBrandPanel } from '../components/LoginBrandPanel';
import { LoginForm } from '../components/LoginForm';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || pkg.version;

export function Login() {
  const { isAuthenticated, perfil } = useAuth();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const rawFrom = (location.state as { from?: { pathname: string } } | null)
    ?.from?.pathname;

  if (isAuthenticated) {
    let targetRoute: string = getDefaultRouteForPerfil(perfil);
    if (rawFrom && rawFrom !== '/login' && rawFrom !== '/landing') {
      const matchedRouteKey = (Object.keys(ROUTE_ROLES) as AppRoutePath[]).find(
        (routeKey) =>
          routeKey === rawFrom ||
          (routeKey !== '/' && rawFrom.startsWith(routeKey))
      );

      if (!matchedRouteKey || hasRouteAccess(perfil, matchedRouteKey)) {
        targetRoute = rawFrom;
      }
    }
    return <Navigate to={targetRoute} replace />;
  }

  return (
    <div className="min-h-svh w-full flex flex-col bg-surface-container-low text-on-surface overflow-x-hidden">
      {/* Corpo principal: 2 colunas em desktop (58% / 42%), 1 coluna centralizada abaixo de lg */}
      <div className="flex-1 flex flex-col lg:flex-row w-full">
        <LoginBrandPanel />

        <div className="flex-1 lg:w-[42%] lg:flex-none flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 bg-surface-container-low">
          {/* Logo compacta no topo para mobile / tablet (< lg) */}
          <div className="flex lg:hidden items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-2xs shrink-0">
              <Package className="size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-sans text-lg font-extrabold tracking-tight leading-none">
                <span className="text-on-surface">Otto</span>
                <span className="text-primary">Stock</span>
              </span>
              <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant leading-none mt-0.5">
                GESTÃO CLÍNICA &amp; ESTOQUE
              </span>
            </div>
          </div>

          <LoginForm fromPath={rawFrom} />
        </div>
      </div>

      {/* Barra de rodapé da página (fundo azul-marinho muito escuro, largura total) */}
      <footer className="w-full bg-on-primary-fixed text-inverse-on-surface border-t border-inverse-surface px-4 py-3.5 sm:px-8">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center lg:justify-between gap-2 text-center lg:text-left text-body-sm">
          <div className="leading-snug">
            <span className="font-semibold text-on-primary">
              OttoStock Clinical
            </span>{' '}
            <span className="text-inverse-on-surface/80">
              — Solução Corporativa de Rastreabilidade e Gestão Hospitalar
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 text-inverse-on-surface/70 font-data-mono text-label-sm">
            <span>Versão {APP_VERSION}</span>
            <span aria-hidden="true">•</span>
            <span className="font-sans">
              Todos os direitos reservados © {currentYear}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
