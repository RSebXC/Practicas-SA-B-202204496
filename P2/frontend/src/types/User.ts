/**
 * Tipos de datos del usuario
 */

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'cliente';
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'cliente';
}

export interface LoginData {
  email: string;
  password: string;
}