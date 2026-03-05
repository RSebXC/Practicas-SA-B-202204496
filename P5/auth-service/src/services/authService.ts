import bcrypt from 'bcryptjs';
import Database from '../config/database';
import { RegisterDTO, LoginDTO, User } from '../models/User';
import { encrypt, decrypt } from './encryptionService';
import { generateToken } from '../utils/jwt';

const db = Database.getInstance();

export const initTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      username   VARCHAR(500) NOT NULL,
      email      VARCHAR(255) UNIQUE NOT NULL,
      password   VARCHAR(255) NOT NULL,
      full_name  VARCHAR(500) NOT NULL,
      role       VARCHAR(50)  DEFAULT 'cliente',
      created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('[Auth] Tabla users lista');
};

export const register = async (data: RegisterDTO) => {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [data.email]);
  if (existing.rows.length > 0) throw new Error('Email ya registrado');

  const hashed   = await bcrypt.hash(data.password, 10);
  const result   = await db.query(
    `INSERT INTO users (username, email, password, full_name, role)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, email, role`,
    [encrypt(data.username), data.email, hashed, encrypt(data.full_name), data.role || 'cliente']
  );
  const user  = result.rows[0];
  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  return { token, user };
};

export const login = async (data: LoginDTO) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [data.email]);
  if (result.rows.length === 0) throw new Error('Credenciales inválidas');

  const user: User = result.rows[0];
  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) throw new Error('Credenciales inválidas');

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  return {
    token,
    user: {
      id: user.id, email: user.email, role: user.role,
      username:  decrypt(user.username),
      full_name: decrypt(user.full_name),
    },
  };
};

export const findById = async (id: number) => {
  const r = await db.query(
    'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = $1', [id]
  );
  if (!r.rows.length) throw new Error('Usuario no encontrado');
  const u = r.rows[0];
  return { ...u, username: decrypt(u.username), full_name: decrypt(u.full_name) };
};
