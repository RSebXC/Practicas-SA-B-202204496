import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'secret';

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'];

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  return jwt.decode(token) as JWTPayload | null;
};
