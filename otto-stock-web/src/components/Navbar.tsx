import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronDown,
  ClipboardList,
  Link2,
  LogOut,
  Menu,
  Package,
  Plus,
  Stethoscope,
  User as UserIcon,
  UserCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { hasRouteAccess, type AppRoutePath } from '../types/auth';
import type { EstoqueSaldoItem } from '../types/estoqueSaldo';

interface NavRouteConfig {
  to: AppRoutePath;
  label: string;
  end?: boolean;
  matchPrefix?: string;
}

interface CadastroRouteConfig {
  to: AppRoutePath;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PRIMARY_NAV_ITEMS: NavRouteConfig[] = [
  { to: '/', label: 'Início', end: true },
  {
    to: '/estoque/saldo',
    label: 'Estoque',
    matchPrefix: '/estoque',
  },
  { to: '/insumos', label: 'Insumos' },
  { to: '/atendimentos', label: 'Atendimentos' },
  { to: '/exames', label: 'Exames' },
];

const CADASTROS_MENU_ITEMS: CadastroRouteConfig[] = [
  {
    to: '/pacientes',
    label: 'Pacientes',
    description: 'Prontuário cadastral e CPF',
    icon: <UserCheck size={16} className="text-primary shrink-0" />,
  },
  {
    to: '/medicos',
    label: 'Médicos',
    description: 'Corpo clínico e CRM',
    icon: <Stethoscope size={16} className="text-primary shrink-0" />,
  },
  {
    to: '/exames',
    label: 'Exames',
    description: 'Catálogo de procedimentos',
    icon: <ClipboardList size={16} className="text-primary shrink-0" />,
  },
  {
    to: '/exame-insumos',
    label: 'Ficha Técnica',
    description: 'Vínculo de insumos por exame',
    icon: <Link2 size={16} className="text-primary shrink-0" />,
  },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, perfil, isAuthenticated, logout } = useAuth();

  const [criticosCount, setCriticosCount] = useState<number>(0);
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cadastrosRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const canReadSaldo = hasRouteAccess(perfil, '/estoque/saldo');
  const canCreateAtendimento = hasRouteAccess(perfil, '/atendimentos');
  const isVisible =
    isAuthenticated &&
    location.pathname !== '/login' &&
    location.pathname !== '/landing';

  function closeAllMenus() {
    setIsCadastrosOpen(false);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  }

  // Clique fora e tecla Escape para fechar menus dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (cadastrosRef.current && !cadastrosRef.current.contains(target)) {
        setIsCadastrosOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsCadastrosOpen(false);
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Busca contagem real de insumos críticos apenas para perfis autorizados a ler saldo
  useEffect(() => {
    if (!isVisible || !canReadSaldo) {
      return;
    }

    let cancelled = false;

    async function fetchCriticosCount() {
      try {
        const response = await api.get('/estoque/saldo');
        if (cancelled) return;
        const data: EstoqueSaldoItem[] = Array.isArray(response.data)
          ? response.data
          : response.data?.items || [];
        const totalCriticos = data.filter(
          (item) => item.alerta || item.saldo < item.quantidadeMinima
        ).length;
        setCriticosCount(totalCriticos);
      } catch {
        // Silencioso no header para não duplicar toasts da página principal
      }
    }

    fetchCriticosCount();

    return () => {
      cancelled = true;
    };
  }, [isVisible, canReadSaldo, location.pathname]);

  // Seção 5: Navbar oculto em /login e sem sessão
  if (!isVisible) {
    return null;
  }

  const visiblePrimaryLinks = PRIMARY_NAV_ITEMS.filter((item) =>
    hasRouteAccess(perfil, item.to)
  );

  const visibleCadastrosLinks = CADASTROS_MENU_ITEMS.filter((item) =>
    hasRouteAccess(perfil, item.to)
  );

  const isCadastroRouteActive = ['/pacientes', '/medicos', '/exame-insumos'].some(
    (path) => location.pathname.startsWith(path)
  );

  function handleLogout() {
    closeAllMenus();
    logout();
    toast.info('Sessão encerrada com sucesso.');
    navigate('/login', { replace: true });
  }

  function handleNovoAtendimento() {
    closeAllMenus();
    navigate('/atendimentos?novo=1');
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/30">
      <div className="h-full w-full max-w-[1600px] mx-auto px-gutter lg:px-margin-desktop flex items-center justify-between gap-space-md">
        {/* Esquerda: Wordmark + Navegação Principal */}
        <div className="flex items-center gap-space-lg">
          <Link
            to="/"
            onClick={closeAllMenus}
            className="flex items-center gap-space-sm no-underline group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-[0_1px_2px_rgba(15,23,42,0.08)] group-hover:bg-primary-container transition-colors">
              <Package size={18} />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight leading-none">
                Otto Stock
              </span>
              <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase leading-none mt-0.5">
                Gestão Clínica
              </span>
            </div>
          </Link>

          {/* Abas Desktop */}
          <nav
            aria-label="Navegação principal"
            className="hidden xl:flex items-center gap-space-xs"
          >
            {visiblePrimaryLinks.map((item) => {
              const isCustomMatch =
                item.matchPrefix &&
                location.pathname.startsWith(item.matchPrefix);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeAllMenus}
                  className={({ isActive }) => {
                    const active = isActive || Boolean(isCustomMatch);
                    return `px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-colors no-underline ${
                      active
                        ? 'bg-surface-container-high text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                    }`;
                  }}
                >
                  {item.label}
                </NavLink>
              );
            })}

            {/* Menu agrupado Cadastros (Pacientes, Médicos, Exames, Ficha Técnica) */}
            {visibleCadastrosLinks.length > 0 && (
              <div className="relative" ref={cadastrosRef}>
                <button
                  type="button"
                  onClick={() => setIsCadastrosOpen((prev) => !prev)}
                  aria-expanded={isCadastrosOpen}
                  aria-haspopup="menu"
                  className={`inline-flex items-center gap-1 px-space-md py-space-sm rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
                    isCadastroRouteActive || isCadastrosOpen
                      ? 'bg-surface-container-high text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                  }`}
                >
                  <span>Cadastros</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-150 ${
                      isCadastrosOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isCadastrosOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 mt-1.5 w-64 rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-1.5 shadow-[0_4px_6px_-1px_rgb(15_23_42/0.07),0_2px_4px_-2px_rgb(15_23_42/0.05)] z-50 text-left"
                  >
                    {visibleCadastrosLinks.map((cad) => (
                      <NavLink
                        key={cad.to}
                        to={cad.to}
                        role="menuitem"
                        onClick={closeAllMenus}
                        className={({ isActive }) =>
                          `flex items-start gap-2.5 px-3 py-2 rounded-lg no-underline transition-colors ${
                            isActive
                              ? 'bg-surface-container-high/80 text-primary font-semibold'
                              : 'text-on-surface hover:bg-surface-container-low'
                          }`
                        }
                      >
                        <div className="mt-0.5">{cad.icon}</div>
                        <div className="flex flex-col">
                          <span className="text-label-md leading-tight">
                            {cad.label}
                          </span>
                          <span className="text-body-sm text-outline leading-tight mt-0.5">
                            {cad.description}
                          </span>
                        </div>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Direita: Alertas Críticos, + Novo Atendimento, Perfil e Menu Mobile */}
        <div className="flex items-center gap-space-sm sm:gap-space-md">
          {/* Sino / Alerta de Insumos Críticos (apenas ADMIN, ESTOQUISTA, GESTOR) */}
          {canReadSaldo && (
            <button
              type="button"
              onClick={() => {
                closeAllMenus();
                navigate('/estoque/saldo');
              }}
              aria-label={`Alertas de estoque crítico: ${criticosCount} insumos`}
              title="Ver insumos em nível crítico"
              className="relative p-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <AlertTriangle
                size={20}
                className={
                  criticosCount > 0 ? 'text-error' : 'text-on-surface-variant'
                }
              />
              {criticosCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-error text-on-error font-label-sm text-[10px] leading-none font-bold tabular-nums">
                  {criticosCount}
                </span>
              )}
            </button>
          )}

          {/* Botão "+ Novo Atendimento" (apenas ADMIN, ATENDENTE, GESTOR) */}
          {canCreateAtendimento && (
            <button
              type="button"
              onClick={handleNovoAtendimento}
              className="hidden sm:inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus size={16} />
              <span>Novo Atendimento</span>
            </button>
          )}

          {/* Perfil do Usuário (AuthContext) + Dropdown Sair */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-space-sm pl-space-xs pr-1 py-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="hidden lg:flex flex-col text-right">
                <div className="flex items-center justify-end gap-space-xs">
                  <span className="font-label-md text-label-md text-on-surface leading-tight font-semibold max-w-[150px] truncate">
                    {usuario?.nome || 'Usuário'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-data-mono text-[10px] leading-none font-bold uppercase">
                    {perfil}
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-outline leading-tight max-w-[180px] truncate">
                  {usuario?.email}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] shrink-0">
                <UserIcon size={16} />
              </div>
            </button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 w-56 rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-1.5 shadow-[0_4px_6px_-1px_rgb(15_23_42/0.07),0_2px_4px_-2px_rgb(15_23_42/0.05)] z-50 text-left"
              >
                <div className="px-3 py-2 border-b border-outline-variant/30 mb-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-label-md font-semibold text-on-surface truncate">
                      {usuario?.nome}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-data-mono text-[10px] font-bold uppercase">
                      {perfil}
                    </span>
                  </div>
                  <p className="text-body-sm text-outline truncate m-0 mt-0.5">
                    {usuario?.email}
                  </p>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-label-md text-error hover:bg-error-container/50 transition-colors cursor-pointer font-medium"
                >
                  <LogOut size={15} />
                  <span>Sair da sessão</span>
                </button>
              </div>
            )}
          </div>

          {/* Botão Menu Mobile / Tablet */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Abrir menu de navegação"
            aria-expanded={isMobileMenuOpen}
            className="xl:hidden p-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Gaveta de Navegação Mobile / Tablet */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-surface-container-lowest border-b border-outline-variant/40 px-gutter py-space-md shadow-md flex flex-col gap-space-sm text-left">
          <div className="flex flex-col gap-1">
            {visiblePrimaryLinks.map((item) => {
              const isCustomMatch =
                item.matchPrefix &&
                location.pathname.startsWith(item.matchPrefix);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeAllMenus}
                  className={({ isActive }) => {
                    const active = isActive || Boolean(isCustomMatch);
                    return `px-space-md py-2 rounded-lg font-label-md text-label-md no-underline ${
                      active
                        ? 'bg-surface-container-high text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`;
                  }}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          {visibleCadastrosLinks.length > 0 && (
            <div className="pt-space-sm border-t border-outline-variant/30 flex flex-col gap-1">
              <span className="px-space-md text-label-sm uppercase tracking-wider text-outline font-semibold">
                Cadastros
              </span>
              {visibleCadastrosLinks.map((cad) => (
                <NavLink
                  key={cad.to}
                  to={cad.to}
                  onClick={closeAllMenus}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-space-md py-2 rounded-lg font-label-md text-label-md no-underline ${
                      isActive
                        ? 'bg-surface-container-high text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`
                  }
                >
                  {cad.icon}
                  <span>{cad.label}</span>
                </NavLink>
              ))}
            </div>
          )}

          {canCreateAtendimento && (
            <div className="pt-space-sm border-t border-outline-variant/30 sm:hidden">
              <button
                type="button"
                onClick={handleNovoAtendimento}
                className="w-full inline-flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-medium"
              >
                <Plus size={16} />
                <span>Novo Atendimento</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}