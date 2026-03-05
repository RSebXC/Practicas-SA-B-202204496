import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { AuthRequest } from '../middleware/authMiddleware';

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000,
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, full_name, role } = req.body;
    if (!username || !email || !password || !full_name) {
      res.status(400).json({ error: 'Todos los campos son requeridos' }); return;
    }
    const result = await authService.register({ username, email, password, full_name, role });
    res.cookie('auth_token', result.token, COOKIE);
    res.status(201).json({ message: 'Usuario registrado', user: result.user });
  } catch (e: unknown) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'Email y password requeridos' }); return; }
    const result = await authService.login({ email, password });
    res.cookie('auth_token', result.token, COOKIE);
    res.json({ message: 'Login exitoso', token: result.token, user: result.user });
  } catch (e: unknown) {
    res.status(401).json({ error: e instanceof Error ? e.message : 'Error' });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await authService.findById(req.user!.userId);
    res.json({ user });
  } catch (e: unknown) {
    res.status(404).json({ error: e instanceof Error ? e.message : 'Error' });
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('auth_token');
  res.json({ message: 'Sesión cerrada' });
};

export const validate = (req: AuthRequest, res: Response): void => {
  res.json({ valid: true, user: req.user });
};
