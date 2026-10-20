import type { ZodError } from 'zod';

/** Flattens zod issues into a compact `[{ field, message }]` list for API error details. */
export function formatZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || undefined,
    message: issue.message,
  }));
}
