/**
 * Rutas Protegidas con Autorización
 * 
 * Demuestra el sistema de roles:
 * - /api/protected/admin - Solo administradores
 * - /api/protected/dashboard - Administradores y clientes
 */

import { Router, Request, Response } from 'express';
import { verifyTokenMiddleware, requireRole } from '../middleware/authMiddleware';

export function createProtectedRoutes(): Router {
  const router = Router();

  /**
   * Ruta solo para ADMIN
   * GET /api/protected/admin
   */
  router.get(
    '/admin',
    verifyTokenMiddleware,
    requireRole(['admin']),
    (req: Request, res: Response) => {
      const user = (req as any).user;

      res.json({
        success: true,
        message: 'Bienvenido al panel de administración',
        data: {
          user: {
            id: user.userId,
            email: user.email,
            role: user.role
          },
          accessLevel: 'admin',
          permissions: ['read', 'write', 'delete', 'manage_users']
        }
      });
    }
  );

  /**
   * Ruta para ADMIN y CLIENTE
   * GET /api/protected/dashboard
   */
  router.get(
    '/dashboard',
    verifyTokenMiddleware,
    requireRole(['admin', 'cliente']),
    (req: Request, res: Response) => {
      const user = (req as any).user;

      res.json({
        success: true,
        message: 'Bienvenido al dashboard',
        data: {
          user: {
            id: user.userId,
            email: user.email,
            role: user.role
          },
          accessLevel: user.role,
          permissions: user.role === 'admin' 
            ? ['read', 'write', 'delete'] 
            : ['read']
        }
      });
    }
  );

  return router;
}