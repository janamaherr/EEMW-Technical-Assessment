import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Invalid email address'));

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email,
  // bcrypt only uses the first 72 bytes of a password.
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
  departmentId: z.uuid('departmentId must be a valid UUID'),
  role: z.enum(['EMPLOYEE', 'MANAGER'], 'role must be EMPLOYEE or MANAGER'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
