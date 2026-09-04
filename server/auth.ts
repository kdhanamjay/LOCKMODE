// EduGuard MDM — Server Authentication, RBAC & API Response Helpers

import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { AdminUser, UserRole } from '../src/types/mdm';

export interface AuthenticatedRequest extends Request {
  user?: AdminUser;
  requestId?: string;
}

export function requestContextMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  req.requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('X-Request-ID', req.requestId);

  // Extract auth token / header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Find matching user or fallback to default admin
    const foundUser = db.adminUsers.find((u) => u.id === token || u.email === token);
    req.user = foundUser || db.adminUsers[0];
  } else {
    // Default to the logged-in School Admin for ease of use in demo/preview
    req.user = db.adminUsers[0];
  }

  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication credentials are required.');
    }
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'SUPER_ADMIN') {
      return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to perform this action.');
    }
    next();
  };
}

export function sendSuccess<T>(res: Response, data: T, message?: string, meta?: Record<string, any>) {
  return res.status(200).json({
    success: true,
    data,
    message,
    meta,
    timestamp: new Date().toISOString(),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  });
}
