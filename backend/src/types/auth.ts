import type { Role } from '../generated/prisma/client';

/** The authenticated user attached to `req.user` by the auth middleware. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
}
