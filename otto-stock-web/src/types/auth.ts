export type Perfil = 'ADMIN' | 'ESTOQUISTA' | 'ATENDENTE' | 'GESTOR';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
}
