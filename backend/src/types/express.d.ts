import type { AuthUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `requireAuth` middleware. */
      user?: AuthUser;
    }
  }
}

export {};
