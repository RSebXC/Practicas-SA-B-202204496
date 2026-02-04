/**
 * Servicio de Solicitudes Operativas
 * 202204496 Rodrigo Sebastian Castro Aguilar
 * SOLID APLICADO:
 * SRP (Single Responsibility Principle)
 * - Responsabilidad única: gestionar la lógica de negocio
 * 
 * DIP (Dependency Inversion Principle)
 * - Depende de la abstracción Pool, no de implementación específica
 * - Recibe dependencias por inyección
 */

import { Pool } from 'pg';
import { SolicitudOperativa, CrearSolicitudDTO, ActualizarEstadoDTO } from '../models/Solicitud';

export class SolicitudService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async obtenerTodas(): Promise<SolicitudOperativa[]> {
    const result = await this.pool.query('SELECT * FROM solicitudes_operativas ORDER BY id DESC');
    return result.rows;
  }

  async obtenerPorId(id: number): Promise<SolicitudOperativa | null> {
    const result = await this.pool.query('SELECT * FROM solicitudes_operativas WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async crear(data: CrearSolicitudDTO): Promise<SolicitudOperativa> {
    const query = `
      INSERT INTO solicitudes_operativas (titulo, area_solicitante, prioridad, costo_estimado, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.titulo,
      data.area_solicitante,
      data.prioridad,
      data.costo_estimado,
      data.estado || 'registrada'
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async actualizar(id: number, data: Partial<CrearSolicitudDTO>): Promise<SolicitudOperativa | null> {
    const campos: string[] = [];
    const valores: any[] = [];
    let index = 1;

    if (data.titulo) {
      campos.push(`titulo = $${index++}`);
      valores.push(data.titulo);
    }
    if (data.area_solicitante) {
      campos.push(`area_solicitante = $${index++}`);
      valores.push(data.area_solicitante);
    }
    if (data.prioridad) {
      campos.push(`prioridad = $${index++}`);
      valores.push(data.prioridad);
    }
    if (data.costo_estimado !== undefined) {
      campos.push(`costo_estimado = $${index++}`);
      valores.push(data.costo_estimado);
    }
    if (data.estado) {
      campos.push(`estado = $${index++}`);
      valores.push(data.estado);
    }

    if (campos.length === 0) return this.obtenerPorId(id);

    valores.push(id);
    const query = `UPDATE solicitudes_operativas SET ${campos.join(', ')} WHERE id = $${index} RETURNING *`;
    
    const result = await this.pool.query(query, valores);
    return result.rows[0] || null;
  }

  async eliminar(id: number): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM solicitudes_operativas WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async actualizarEstado(id: number, data: ActualizarEstadoDTO): Promise<SolicitudOperativa | null> {
    const query = 'UPDATE solicitudes_operativas SET estado = $1 WHERE id = $2 RETURNING *';
    const result = await this.pool.query(query, [data.estado, id]);
    return result.rows[0] || null;
  }
}