import { ApiError } from "@/lib/api/client";

/** A user-facing message for any thrown value. */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Maps API field errors to `{ field: message }` (first message per field wins). */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const result: Record<string, string> = {};
  for (const issue of error.fieldIssues) {
    if (issue.field && !result[issue.field]) result[issue.field] = issue.message;
  }
  return result;
}
