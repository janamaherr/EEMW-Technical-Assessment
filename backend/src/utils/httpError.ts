/**
 * An error that carries an HTTP status and a stable machine-readable code. Throw it from any
 * layer and the error-handling middleware turns it into
 * `{ error: { code, message, details? } }`.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new HttpError(400, 'BAD_REQUEST', message, details);
  }

  static validation(details: unknown, message = 'Validation failed') {
    return new HttpError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new HttpError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You are not allowed to perform this action') {
    return new HttpError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Not found') {
    return new HttpError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string) {
    return new HttpError(409, 'CONFLICT', message);
  }

  static fileTooLarge(message: string) {
    return new HttpError(413, 'FILE_TOO_LARGE', message);
  }

  static unsupportedFileType(message: string) {
    return new HttpError(415, 'UNSUPPORTED_FILE_TYPE', message);
  }
}
