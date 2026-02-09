import type { Request, Response, NextFunction } from 'express';
import { verifyJwt, type AuthUser } from '../routes/auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  verifyJwt(token)
    .then((user) => {
      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
        return;
      }
      req.user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
    });
}
