import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, UserRecord } from '../db.js';
import { UserRole } from '../../src/types/index.js';

const TOKEN_SECRET = process.env.SESSION_SECRET || 'TEAM_MEMBER_SYSTEM_SECRET_KEY_2026_DHAKA';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function generateToken(user: UserRecord): string {
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    rmCode: user.rmCode,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyToken(token: string): { sub: string; username: string; role: UserRole; rmCode?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
    if (signature !== expected) return null;

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (decoded.exp && Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }

  const user = db.getUserById(decoded.sub);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User record not found' });
  }

  if (user.status !== 'Active') {
    return res.status(403).json({ error: `Account is ${user.status}. Please contact bank administrator.` });
  }

  req.user = user;
  next();
}

export function requireRoles(roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this operation' });
    }
    next();
  };
}

export function requireAdminOrMentor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRoles(['Admin', 'Mentor'])(req, res, next);
}

export function requireMentorOnly(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRoles(['Mentor'])(req, res, next);
}
