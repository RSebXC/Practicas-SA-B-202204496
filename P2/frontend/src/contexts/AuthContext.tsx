/**
 * Contexto de Autenticación
 * 
 * Maneja el estado global de autenticación:
 * - Usuario actual
 * - Login/Logout
 * - Verificación de sesión
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User, RegisterData, LoginData } from '../types/User';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Verificar si hay una sesión activa al cargar la app
   */
  const checkAuth = async () => {
    try {
      const userData = await authService.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Iniciar sesión
   */
  const login = async (data: LoginData) => {
    try {
      const userData = await authService.login(data);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Registrar usuario
   */
  const register = async (data: RegisterData) => {
    try {
      await authService.register(data);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};