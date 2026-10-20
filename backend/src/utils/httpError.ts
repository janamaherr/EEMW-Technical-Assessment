/**
 * An error that carries an HTTP status code. Throw it from any layer and the
 * error-handling middleware turns it into a JSON response.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new HttpError(400, message, details);
  }

  static forbidden(message = 'Forbidden') {
    return new HttpError(403, message);
  }

  static notFound(message = 'Not found') {
    return new HttpError(404, message);
  }
}
