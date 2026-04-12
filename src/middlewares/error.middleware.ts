import { Request, Response, NextFunction } from 'express';
import { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } from 'sequelize';
import logger from '../utils/logger';
import { sendError, sendServerError } from '../utils/response';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`${req.method} ${req.url} — ${err.message}`, { stack: err.stack });

  if (err instanceof UniqueConstraintError) {
    const fields = err.errors.map((e) => e.message);
    sendError(res, 'El recurso ya existe', 409, fields);
    return;
  }

  if (err instanceof ValidationError) {
    const messages = err.errors.map((e) => e.message);
    sendError(res, 'Error de validación', 422, messages);
    return;
  }

  if (err instanceof ForeignKeyConstraintError) {
    sendError(res, 'Referencia inválida: el recurso relacionado no existe', 400);
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  sendServerError(res);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Ruta no encontrada: ${req.method} ${req.url}`, 404);
};
