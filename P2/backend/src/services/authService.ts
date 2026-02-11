import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { User, RegisterDTO, LoginDTO } from '../models/User';
import { EncryptionService } from './encryptionService';

export class AuthService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async register(data: RegisterDTO): Promise<User> {
    // Encriptar solo username y full_name (NO el email)
    const encryptedUsername = EncryptionService.encrypt(data.username);
    const encryptedFullName = EncryptionService.encrypt(data.full_name);

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const query = `
      INSERT INTO users (username, email, password, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, full_name, role, created_at
    `;

    const values = [
      encryptedUsername,
      data.email.toLowerCase(), // Email en minúsculas sin encriptar
      hashedPassword,
      encryptedFullName,
      data.role || 'cliente'
    ];

    const result = await this.pool.query(query, values);
    const user = result.rows[0];

    // Desencriptar para retornar
    return {
      ...user,
      username: EncryptionService.decrypt(user.username),
      full_name: EncryptionService.decrypt(user.full_name)
    };
  }

  async login(data: LoginDTO): Promise<User | null> {
    console.log('🔍 Intentando login con email:', data.email);
    
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [data.email.toLowerCase()]);

    console.log('📊 Usuarios encontrados:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('❌ No se encontró usuario con ese email');
      return null;
    }

    const user = result.rows[0];
    console.log('👤 Usuario encontrado ID:', user.id);

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    console.log('🔑 Contraseña válida:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
      return null;
    }

    // Desencriptar datos
    return {
      ...user,
      username: EncryptionService.decrypt(user.username),
      full_name: EncryptionService.decrypt(user.full_name)
    };
  }

  async getUserById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    return {
      ...user,
      username: EncryptionService.decrypt(user.username),
      full_name: EncryptionService.decrypt(user.full_name)
    };
  }
}