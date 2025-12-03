import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@utils/jwt.utils';
import { UnauthorizedError } from '@utils/errors';
import { JWTPayload } from '../types/jwt.types';

// Extend Request interface using declaration merging
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Authenticate user by verifying JWT token

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

// Check if user is admin

export function isAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new UnauthorizedError('Admin access required'));
  }

  next();
}
