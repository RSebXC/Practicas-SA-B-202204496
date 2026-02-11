/**
 * Rutas de Autenticación
 * 
 * Endpoints públicos (no requieren autenticación):
 * - POST /api/auth/register - Registrar usuario
 * - POST /api/auth/login - Iniciar sesión
 * 
 * Endpoints protegidos (requieren autenticación):
 * - POST /api/auth/logout - Cerrar sesión
 * - POST /api/auth/refresh - Renovar token
 * - GET /api/auth/me - Información del usuario actual
 */

import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { verifyTokenMiddleware } from '../middleware/authMiddleware';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  // Rutas públicas
  router.post('/register', controller.register);
  router.post('/login', controller.login);

  // Rutas protegidas (requieren token)
  router.post('/logout', verifyTokenMiddleware, controller.logout);
  router.post('/refresh', controller.refresh);
  router.get('/me', verifyTokenMiddleware, controller.me);

  return router;
}