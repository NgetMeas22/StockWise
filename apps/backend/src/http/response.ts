import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, meta?: Record<string, unknown>): Response {
  if (statusCode === 204) {
    return res.status(204).end();
  }
  return res.status(statusCode).json({
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  extraMeta?: Record<string, unknown>
): Response {
  const totalPages = Math.ceil(total / pageSize);
  return res.status(200).json({
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      ...extraMeta,
    },
  });
}

