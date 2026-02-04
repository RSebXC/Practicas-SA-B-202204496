/**
 * Configuración de conexión a PostgreSQL
 * 
 * SOLID APLICADO:
 * ✅ SRP (Single Responsibility Principle)
 * - Esta clase tiene UNA SOLA responsabilidad: gestionar la conexión a la base de datos
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'academia_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || ''
    });
  }

  getPool(): Pool {
    return this.pool;
  }

  async inicializarTabla(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS solicitudes_operativas (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        area_solicitante VARCHAR(255) NOT NULL,
        prioridad INTEGER NOT NULL CHECK (prioridad >= 1 AND prioridad <= 5),
        costo_estimado DECIMAL(10, 2) NOT NULL CHECK (costo_estimado >= 0),
        estado VARCHAR(50) NOT NULL CHECK (estado IN ('registrada', 'en_proceso', 'finalizada'))
      );
    `;
    
    await this.pool.query(query);
    console.log('✅ Tabla creada o ya existe');
  }
}

export default new Database();