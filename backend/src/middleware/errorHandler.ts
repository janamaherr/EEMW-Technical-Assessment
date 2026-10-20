import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { config } from '../config/env';
import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../utils/httpError';
import { formatZodIssues } from '../utils/zod';

/** Maps any thrown value to an HttpError so every response has the same shape. */
function toHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) return err;

  if (err instanceof ZodError) return HttpError.validation(formatZodIssues(err));

  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return HttpError.fileTooLarge(`File exceeds the ${config.maxFileSizeMb} MB limit`);
      case 'LIMIT_UNEXPECTED_FILE':
        return HttpError.badRequest(`Unexpected file field "${err.field}"; use "file"`);
      default:
        return HttpError.badRequest(err.message);
    }
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    return HttpError.badRequest('Malformed JSON body');
  }

  // Safety net for races the services don't pre-check (e.g. concurrent signups).
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return HttpError.conflict('Resource already exists');
  }

  return new HttpError(500, 'INTERNAL_ERROR', 'Internal server error');
}

// Express identifies error handlers by their 4-argument signature, so `_next` must stay.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const httpError = toHttpError(err);

  if (httpError.status >= 500) console.error(err);

  res.status(httpError.status).json({
    error: {
      code: httpError.code,
      message: httpError.message,
      ...(httpError.details !== undefined && { details: httpError.details }),
      ...(httpError.status >= 500 && !config.isProduction && { details: String(err) }),
    },
  });
}
