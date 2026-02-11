/**
 * Controlador de Autenticación
 * Maneja el registro, login, logout y renovación de tokens
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { generateToken, verifyToken, decodeToken } from '../utils/jwt';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Registrar nuevo usuario
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, full_name, role } = req.body;

      // Validar campos requeridos
      if (!username || !email || !password || !full_name) {
        res.status(400).json({
          success: false,
          error: 'Todos los campos son requeridos'
        });
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Email inválido'
        });
        return;
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres'
        });
        return;
      }

      // Validar rol si se proporciona
      if (role && role !== 'admin' && role !== 'cliente') {
        res.status(400).json({
          success: false,
          error: 'Rol inválido. Debe ser "admin" o "cliente"'
        });
        return;
      }

      // Registrar usuario
      const user = await this.authService.register({
        username,
        email,
        password,
        full_name,
        role: role || 'cliente'
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      });

    } catch (error: any) {
      console.error('Error en register:', error);

      // Manejar errores de duplicados
      if (error.code === '23505') { // Código de error de PostgreSQL para duplicados
        res.status(409).json({
          success: false,
          error: 'El email o username ya está registrado'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error al registrar usuario'
      });
    }
  };

  /**
   * Iniciar sesión
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validar campos
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email y contraseña son requeridos'
        });
        return;
      }

      // Autenticar usuario
      const user = await this.authService.login({ email, password });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
        return;
      }

      // Generar JWT
      const token = generateToken({
        userId: user.id!,
        email: user.email,
        role: user.role
      });

      // Configurar cookie HttpOnly
      // Esta cookie NO es visible ni accesible desde JavaScript del navegador
      res.cookie('auth_token', token, {
        httpOnly: true,  // No accesible desde JavaScript
        secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
        sameSite: 'strict', // Protección contra CSRF
        maxAge: 15 * 60 * 1000 // 15 minutos en milisegundos
      });

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        error: 'Error al iniciar sesión'
      });
    }
  };

  /**
   * Cerrar sesión
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // Limpiar cookie
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.json({
        success: true,
        message: 'Logout exitoso'
      });

    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cerrar sesión'
      });
    }
  };

  /**
   * Renovar token JWT
   * POST /api/auth/refresh
   * 
   * Renueva el token si ha expirado pero está dentro de la ventana de renovación
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.cookies.auth_token;

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No hay token para renovar'
        });
        return;
      }

      // Decodificar token (sin verificar, para ver si expiró)
      const decoded = decodeToken(token);

      if (!decoded) {
        res.status(401).json({
          success: false,
          error: 'Token inválido'
        });
        return;
      }

      // Obtener tiempo de expiración
      const exp = (decoded as any).exp;
      const now = Math.floor(Date.now() / 1000);

      // Calcular ventana de renovación (5 minutos por defecto)
      const refreshWindow = parseInt(process.env.JWT_REFRESH_WINDOW || '5') * 60;

      // Verificar si el token expiró hace menos de la ventana de renovación
      if (exp && now - exp > refreshWindow) {
        res.status(401).json({
          success: false,
          error: 'Token expirado fuera de la ventana de renovación. Por favor inicie sesión nuevamente.'
        });
        return;
      }

      // Verificar que el usuario todavía exista
      const user = await this.authService.getUserById(decoded.userId);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Usuario no encontrado'
        });
        return;
      }

      // Generar nuevo token
      const newToken = generateToken({
        userId: user.id!,
        email: user.email,
        role: user.role
      });

      // Actualizar cookie
      res.cookie('auth_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });

      res.json({
        success: true,
        message: 'Token renovado exitosamente'
      });

    } catch (error) {
      console.error('Error en refresh:', error);
      res.status(500).json({
        success: false,
        error: 'Error al renovar token'
      });
    }
  };

  /**
   * Verificar sesión actual
   * GET /api/auth/me
   */
  me = async (req: Request, res: Response): Promise<void> => {
    try {
      // El middleware ya verificó el token y agregó el usuario a req
      const userId = (req as any).user.userId;

      const user = await this.authService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Error en me:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener información del usuario'
      });
    }
  };
}