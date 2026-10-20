import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { HttpError } from '../utils/httpError';
import { formatZodIssues } from '../utils/zod';

/**
 * Validates `req.body` against a zod schema and replaces it with the parsed (trimmed, coerced,
 * defaulted) value. Responds 400 with field-level details on failure.
 */
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      throw HttpError.validation(formatZodIssues(result.error));
    }
    req.body = result.data;
    next();
  };
}
