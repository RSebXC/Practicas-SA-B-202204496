import { Pool } from 'pg';

class Database {
  private static instance: Pool;
  static getInstance(): Pool {
    if (!Database.instance) {
      Database.instance = new Pool({
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl:      { rejectUnauthorized: false },
      });
    }
    return Database.instance;
  }
}

export default Database;
