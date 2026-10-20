import type { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      status: 404,
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}
