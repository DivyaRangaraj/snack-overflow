import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { prisma } from '../config/database';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AuthenticationError());
  }
  if (req.user.role !== 'ADMIN') {
    return next(new AuthorizationError('Admin access required'));
  }
  next();
}
