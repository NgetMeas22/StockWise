import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../http/errors.js';

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(options: ValidationOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (options.params) {
        req.params = (await options.params.parseAsync(req.params)) as any;
      }
      if (options.query) {
        req.query = (await options.query.parseAsync(req.query)) as any;
      }
      if (options.body) {
        req.body = (await options.body.parseAsync(req.body)) as any;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formatted = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        const fieldDetails = formatted
          .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
          .join(', ');
        return next(
          new ValidationError(
            fieldDetails ? `Validation failed (${fieldDetails})` : 'Request validation failed',
            formatted
          )
        );
      }
      next(err);
    }
  };
}

