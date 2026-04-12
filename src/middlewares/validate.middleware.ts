import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { sendError } from '../utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: ObjectSchema, target: ValidationTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true });

    if (error) {
      const messages = error.details.map((d) => d.message);
      sendError(res, 'Validation error', 422, messages);
      return;
    }

    req[target] = value;
    next();
  };
