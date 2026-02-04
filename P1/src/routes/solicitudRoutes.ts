/**
 * Rutas de la API
 * 
 * SOLID APLICADO:
 * ✅ SRP - Responsabilidad única: definir las rutas HTTP
 */

import { Router } from 'express';
import { SolicitudController } from '../controllers/SolicitudController';

export function crearRutas(controller: SolicitudController): Router {
  const router = Router();

  router.get('/', controller.obtenerTodas);
  router.get('/:id', controller.obtenerPorId);
  router.post('/', controller.crear);
  router.put('/:id', controller.actualizar);
  router.delete('/:id', controller.eliminar);
  router.patch('/:id/estado', controller.actualizarEstado);

  return router;
}