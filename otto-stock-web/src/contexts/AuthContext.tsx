/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/api';
import type { Usuario, Perfil, LoginResponse } from '../types/auth';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  perfil: Perfil | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('usuario');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as Usuario;
        if (!parsedUser.perfil && Array.isArray(parsedUser.perfis) && parsedUser.perfis.length > 0) {
          parsedUser.perfil = parsedUser.perfis.includes('ADMIN')
            ? 'ADMIN'
            : parsedUser.perfis[0];
        }
        setToken(storedToken);
        setUsuario(parsedUser);
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setToken(null);
      setUsuario(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function login(email: string, senha: string): Promise<Usuario> {
    const response = await api.post<LoginResponse>('/auth/login', { email, senha });
    const { usuario: rawUser, token: jwtToken } = response.data;
    const normalizedPerfil: Perfil =
      rawUser.perfis?.includes('ADMIN')
        ? 'ADMIN'
        : rawUser.perfil || rawUser.perfis?.[0] || 'ATENDENTE';

    const user: Usuario = {
      ...rawUser,
      perfil: normalizedPerfil,
      perfis: rawUser.perfis || [normalizedPerfil],
    };

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('usuario', JSON.stringify(user));

    setToken(jwtToken);
    setUsuario(user);
    return user;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }

  const value: AuthContextType = {
    usuario,
    token,
    perfil:
      usuario?.perfis?.includes('ADMIN')
        ? 'ADMIN'
        : usuario?.perfil || usuario?.perfis?.[0] || null,
    isAuthenticated: Boolean(token && usuario),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
