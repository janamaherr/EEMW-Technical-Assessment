import type { NextFunction, Request, Response } from 'express';
import { findUserById } from '../repositories/user.repository';
import type { AuthUser } from '../types/auth';
import { HttpError } from '../utils/httpError';
import { verifyToken } from '../utils/jwt';

/**
 * Requires `Authorization: Bearer <token>`. Missing, invalid or expired tokens get 401.
 * The user is re-loaded from the database on every request so role/department changes
 * (or a deleted account) take effect immediately rather than when the token expires.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const [scheme, token] = header?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    throw HttpError.unauthorized('Missing or malformed Authorization header');
  }

  const userId = verifyToken(token);
  const user = await findUserById(userId);
  if (!user) throw HttpError.unauthorized('User no longer exists');

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
  };
  next();
}

/** Returns the authenticated user; for handlers mounted behind `requireAuth`. */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw HttpError.unauthorized();
  return req.user;
}
