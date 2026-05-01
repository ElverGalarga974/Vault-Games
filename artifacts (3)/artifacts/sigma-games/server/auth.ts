import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'vault-game-secret-key-change-in-production';

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
}

export function signToken(userId: number, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
  } catch {
    return null;
  }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  try {
    const result = await pool.query('SELECT id FROM sessions WHERE token = $1 AND expires_at > NOW()', [token]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Session expired' });
    }
  } catch (err) {
    console.error('Auth middleware DB error:', err);
    return res.status(500).json({ error: 'Authentication error' });
  }
  req.userId = payload.userId;
  req.username = payload.username;
  next();
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      req.userId = payload.userId;
      req.username = payload.username;
    }
  }
  next();
}
