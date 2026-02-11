/**
 * Middleware de Autenticación y Autorización
 * 
 * - verifyToken: Verifica que el JWT sea válido
 * - requireRole: Verifica que el usuario tenga el rol necesario
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

/**
 * Middleware para verificar token JWT
 * Lee el token de las cookies y lo valida
 */
export const verifyTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Leer token de las cookies
    const token = req.cookies.auth_token;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No autenticado. Token no proporcionado.'
      });
      return;
    }

    // Verificar token
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Token inválido o expirado'
      });
      return;
    }

    // Agregar información del usuario al request
    (req as any).user = decoded;
    next();

  } catch (error) {
    console.error('Error en verifyTokenMiddleware:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar autenticación'
    });
  }
};

/**
 * Middleware para verificar roles
 * Uso: requireRole(['admin']) o requireRole(['admin', 'cliente'])
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'No autenticado'
        });
        return;
      }

      // Verificar si el rol del usuario está en los roles permitidos
      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: 'No tiene permisos para acceder a este recurso'
        });
        return;
      }

      next();

    } catch (error) {
      console.error('Error en requireRole:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar permisos'
      });
    }
  };
};