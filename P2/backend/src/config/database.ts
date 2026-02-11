// src/config/database.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL no está definida en .env');
    }

    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false  // Necesario para Supabase en desarrollo (self-signed cert)
      }
    });
  }

  getPool(): Pool {
    return this.pool;
  }

  async inicializarTablas(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'cliente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_username ON users(username);
    `;

    await this.pool.query(query);
    console.log('✅ Tabla users creada');
  }
}

export default new Database();