import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { HttpError } from './httpError';

interface TokenPayload {
  sub: string; // user id
}

export function signToken(userId: string): string {
  return jwt.sign({}, config.jwtSecret, {
    subject: userId,
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  });
}

/** Returns the user id from a valid token, or throws 401. */
export function verifyToken(token: string): string {
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub) {
      throw HttpError.unauthorized('Invalid token');
    }
    return (payload as TokenPayload).sub;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw HttpError.unauthorized('Token expired');
    if (err instanceof HttpError) throw err;
    throw HttpError.unauthorized('Invalid token');
  }
}
