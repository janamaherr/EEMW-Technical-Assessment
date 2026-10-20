import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/env';
import { HttpError } from '../utils/httpError';

// Express identifies error handlers by their 4-argument signature, so `_next` must stay.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { status: err.status, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: { status: 400, message: 'Validation failed', details: err.issues },
    });
    return;
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { status: 400, message: 'Malformed JSON body' } });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      status: 500,
      message: 'Internal server error',
      ...(config.isProduction ? {} : { details: String(err) }),
    },
  });
}
