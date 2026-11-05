import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../http/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = req.id || (res.getHeader('X-Request-Id') as string) || '';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
        requestId,
      },
    });
    return;
  }

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? (err.meta.target as string[]).join(', ') : 'field';
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: `A resource with this ${target} already exists.`,
          requestId,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'The requested record was not found.',
          requestId,
        },
      });
      return;
    }

    if (err.code === 'P2003') {
      res.status(409).json({
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Operation cannot be completed because the record is referenced by other items.',
          requestId,
        },
      });
      return;
    }
  }

  // PostgreSQL check constraint violations
  if ((err as any).code === '23514') {
    res.status(409).json({
      error: {
        code: 'CHECK_VIOLATION',
        message: 'The requested operation violates a business integrity rule.',
        requestId,
      },
    });
    return;
  }

  // Unexpected Internal Error
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      requestId,
      url: req.originalUrl,
      method: req.method,
    },
    'Unhandled server error'
  );

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred. Please contact support.',
      requestId,
    },
  });
}

