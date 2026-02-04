/**
 * Modelo de datos para Solicitud Operativa
 * 202204496 Rodrigo Sebastian Castro Aguilar
 * SOLID APLICADO:
 * SRP (Single Responsibility Principle)
 * - Este archivo tiene UNA SOLA responsabilidad: definir los tipos de datos
 */

export interface SolicitudOperativa {
  id?: number;
  titulo: string;
  area_solicitante: string;
  prioridad: number;
  costo_estimado: number;
  estado: 'registrada' | 'en_proceso' | 'finalizada';
}

export interface CrearSolicitudDTO {
  titulo: string;
  area_solicitante: string;
  prioridad: number;
  costo_estimado: number;
  estado?: 'registrada' | 'en_proceso' | 'finalizada';
}

export interface ActualizarEstadoDTO {
  estado: 'registrada' | 'en_proceso' | 'finalizada';
}