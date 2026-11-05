import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existing = req.header('X-Request-Id');
  const id = existing && existing.trim() !== '' ? existing : uuidv4();
  req.id = id;
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
