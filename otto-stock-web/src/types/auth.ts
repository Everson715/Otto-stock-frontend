export type Perfil = 'ADMIN' | 'ESTOQUISTA' | 'ATENDENTE' | 'GESTOR';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  perfis?: Perfil[];
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
}

export const ALL_ROLES: Perfil[] = ['ADMIN', 'ESTOQUISTA', 'ATENDENTE', 'GESTOR'];

/**
 * Matriz única de permissões por rota (compartilhada entre App.tsx e Navbar.tsx)
 */
export const ROUTE_ROLES = {
  '/': ALL_ROLES,
  '/pacientes': ['ADMIN', 'ATENDENTE', 'GESTOR'] as Perfil[],
  '/medicos': ['ADMIN', 'GESTOR'] as Perfil[],
  '/atendimentos': ['ADMIN', 'ATENDENTE', 'GESTOR'] as Perfil[],
  '/insumos': ['ADMIN', 'ESTOQUISTA'] as Perfil[],
  '/exames': ['ADMIN'] as Perfil[],
  '/exame-insumos': ['ADMIN', 'ESTOQUISTA'] as Perfil[],
  '/estoque': ['ADMIN', 'ESTOQUISTA'] as Perfil[],
  '/estoque/saldo': ['ADMIN', 'ESTOQUISTA', 'GESTOR'] as Perfil[],
  '/estoque/movimentacoes': ['ADMIN', 'ESTOQUISTA', 'GESTOR'] as Perfil[],
  '/usuarios': ['ADMIN'] as Perfil[],
} as const;

export type AppRoutePath = keyof typeof ROUTE_ROLES;

export function hasRouteAccess(
  perfil: Perfil | null | undefined,
  route: AppRoutePath
): boolean {
  if (!perfil) return false;
  if (perfil === 'ADMIN') return true;
  return ROUTE_ROLES[route].includes(perfil);
}

export function getDefaultRouteForPerfil(
  perfil: Perfil | null | undefined
): AppRoutePath {
  if (!perfil || hasRouteAccess(perfil, '/')) {
    return '/';
  }
  const availableRoute = (Object.keys(ROUTE_ROLES) as AppRoutePath[]).find((route) =>
    hasRouteAccess(perfil, route)
  );
  return availableRoute || '/';
}
