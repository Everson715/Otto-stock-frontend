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
  login: (email: string, senha: string) => Promise<void>;
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

  async function login(email: string, senha: string) {
    const response = await api.post<LoginResponse>('/auth/login', { email, senha });
    const { usuario: user, token: jwtToken } = response.data;

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('usuario', JSON.stringify(user));

    setToken(jwtToken);
    setUsuario(user);
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
    perfil: usuario?.perfil || null,
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
