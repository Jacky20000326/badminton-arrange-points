import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { JWTPayload } from '../types/auth';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * 驗證 JWT token 的中間件
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 從 Authorization header 獲取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前綴

    // 驗證 token
    const payload = AuthService.verifyToken(token);

    // 將用戶信息附加到 request
    req.user = payload;

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * 驗證用戶是否為團主或管理員
 */
export const requireOrganizerOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Only organizers and admins can access this resource' });
    return;
  }

  next();
};

/**
 * 驗證用戶是否為管理員
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Only admins can access this resource' });
    return;
  }

  next();
};
