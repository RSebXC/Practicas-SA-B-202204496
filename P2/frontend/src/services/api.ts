/**
 * Servicio para comunicación con el backend
 * Usa axios para hacer peticiones HTTP
 */

import axios from 'axios';
import type { User, RegisterData, LoginData } from '../types/User';

// URL base del backend
const API_URL = 'http://localhost:4000/api';

// Configurar axios para enviar cookies automáticamente
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // IMPORTANTE: Permite enviar cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Registrar nuevo usuario
   */
  register: async (data: RegisterData): Promise<User> => {
    try {
      const response = await api.post('/auth/register', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al registrar usuario');
    }
  },

  /**
   * Iniciar sesión
   */
  login: async (data: LoginData): Promise<User> => {
    try {
      const response = await api.post('/auth/login', data);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
    }
  },

  /**
   * Cerrar sesión
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al cerrar sesión');
    }
  },

  /**
   * Obtener información del usuario actual
   */
  me: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al obtener usuario');
    }
  },

  /**
   * Renovar token
   */
  refresh: async (): Promise<void> => {
    try {
      await api.post('/auth/refresh');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al renovar token');
    }
  },
};

/**
 * Servicio de rutas protegidas
 */
export const protectedService = {
  /**
   * Acceder al panel de administración (solo admin)
   */
  getAdminPanel: async (): Promise<any> => {
    try {
      const response = await api.get('/protected/admin');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al acceder al panel admin');
    }
  },

  /**
   * Acceder al dashboard (admin y cliente)
   */
  getDashboard: async (): Promise<any> => {
    try {
      const response = await api.get('/protected/dashboard');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al acceder al dashboard');
    }
  },
};

export default api;