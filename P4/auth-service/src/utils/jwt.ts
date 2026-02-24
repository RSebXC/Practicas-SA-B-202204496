import jwt from 'jsonwebtoken';
import { JwtPayload } from '../models/User';

const SECRET  = process.env.JWT_SECRET   || 'fallback_secret';
const EXPIRES = process.env.JWT_EXPIRES_IN || '15m';

export const generateToken = (payload: JwtPayload): string =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES } as jwt.SignOptions);

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, SECRET) as JwtPayload;
