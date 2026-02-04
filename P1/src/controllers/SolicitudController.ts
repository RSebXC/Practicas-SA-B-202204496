/**
 * Controlador de Solicitudes
 * 202204496 Rodrigo Sebastian Castro Aguilar
 * SOLID APLICADO:
 * SRP - Responsabilidad única: manejar peticiones HTTP
 * DIP - Depende del servicio por inyección
 */

import { Request, Response } from 'express';
import { SolicitudService } from '../services/SolicitudService';

export class SolicitudController {
  private service: SolicitudService;

  constructor(service: SolicitudService) {
    this.service = service;
  }

  obtenerTodas = async (req: Request, res: Response) => {
    try {
      const solicitudes = await this.service.obtenerTodas();
      res.json({ success: true, data: solicitudes });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener solicitudes' });
    }
  };

  obtenerPorId = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const solicitud = await this.service.obtenerPorId(id);
      
      if (!solicitud) {
        return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
      }
      
      res.json({ success: true, data: solicitud });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al obtener solicitud' });
    }
  };

  crear = async (req: Request, res: Response) => {
    try {
      const solicitud = await this.service.crear(req.body);
      res.status(201).json({ success: true, data: solicitud });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Error al crear solicitud' });
    }
  };

  actualizar = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const solicitud = await this.service.actualizar(id, req.body);
      
      if (!solicitud) {
        return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
      }
      
      res.json({ success: true, data: solicitud });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Error al actualizar solicitud' });
    }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const eliminado = await this.service.eliminar(id);
      
      if (!eliminado) {
        return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
      }
      
      res.json({ success: true, message: 'Solicitud eliminada' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error al eliminar solicitud' });
    }
  };

  actualizarEstado = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const solicitud = await this.service.actualizarEstado(id, req.body);
      
      if (!solicitud) {
        return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
      }
      
      res.json({ success: true, data: solicitud });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Error al actualizar estado' });
    }
  };
}