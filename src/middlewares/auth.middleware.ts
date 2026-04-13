import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';
import { sendUnauthorized, sendForbidden } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const extractToken = (req: Request): string | null => {
  // 1. Cookie httpOnly (preferido — no accesible desde JS del cliente)
  if (req.cookies?.access_token) return req.cookies.access_token as string;

  // 2. Fallback: Authorization header (útil para Postman / clientes móviles)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.split(' ')[1];

  return null;
};

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);

  if (!token) {
    sendUnauthorized(res, 'Token no proporcionado');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? '') as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    sendUnauthorized(res, 'Token inválido o expirado');
  }
};

export const authorize = (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'No tienes permisos para esta acción');
      return;
    }

    next();
  };