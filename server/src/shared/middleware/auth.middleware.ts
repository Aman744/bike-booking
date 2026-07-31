import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env.config';
import { AppError } from '../utils/appError';

export interface DecodedAdmin {
  id: string;
  role: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      admin?: DecodedAdmin;
    }
  }
}

const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token = '';

    // 1. Try Bearer header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else {
      // 2. Try HTTP cookie
      const cookies = parseCookies(req.headers.cookie);
      token = cookies['token'] || '';
    }

    if (!token) {
      throw new AppError('Authentication failed. No access token was provided.', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedAdmin;
    req.admin = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new AppError('Session expired. Please log in again.', 401));
    } else if (error.name === 'JsonWebTokenError') {
      next(new AppError('Session verification failed. Invalid token.', 401));
    } else {
      next(error);
    }
  }
};

export default authMiddleware;
