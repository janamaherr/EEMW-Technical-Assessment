import type { Role } from '../generated/prisma/client';
import { type Db, prisma } from './db';

/** Public user fields; password_hash is never selected unless explicitly needed. */
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  departmentId: true,
  createdAt: true,
  department: { select: { id: true, name: true } },
} as const;

export function findUserById(id: string, db: Db = prisma) {
  return db.user.findUnique({ where: { id }, select: publicUserSelect });
}

/** Includes the password hash; only for credential checks. */
export function findUserWithPasswordByEmail(email: string, db: Db = prisma) {
  return db.user.findUnique({
    where: { email },
    select: { ...publicUserSelect, passwordHash: true },
  });
}

export function emailExists(email: string, db: Db = prisma) {
  return db.user.count({ where: { email } }).then((n) => n > 0);
}

export function createUser(
  data: { name: string; email: string; passwordHash: string; role: Role; departmentId: string },
  db: Db = prisma,
) {
  return db.user.create({ data, select: publicUserSelect });
}
