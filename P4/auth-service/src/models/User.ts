export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'cliente';
  created_at: Date;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'cliente';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}
