import bcrypt from 'bcryptjs';
import { departmentExists } from '../repositories/department.repository';
import {
  createUser,
  emailExists,
  findUserById,
  findUserWithPasswordByEmail,
} from '../repositories/user.repository';
import { HttpError } from '../utils/httpError';
import { signToken } from '../utils/jwt';
import type { LoginInput, SignupInput } from '../validators/auth.schemas';

const BCRYPT_ROUNDS = 10;

// Compared against when the email is unknown, so a failed login takes the same time whether
// or not the account exists (prevents discovering registered emails by timing).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

const INVALID_CREDENTIALS = 'Invalid email or password';

export async function signup(input: SignupInput) {
  if (await emailExists(input.email)) {
    throw HttpError.conflict('Email is already registered');
  }
  if (!(await departmentExists(input.departmentId))) {
    throw HttpError.badRequest('Department does not exist');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    departmentId: input.departmentId,
  });

  return { token: signToken(user.id), user };
}

export async function login(input: LoginInput) {
  const found = await findUserWithPasswordByEmail(input.email);
  const passwordOk = await bcrypt.compare(input.password, found?.passwordHash ?? DUMMY_HASH);

  if (!found || !passwordOk) {
    throw HttpError.unauthorized(INVALID_CREDENTIALS);
  }

  const { passwordHash, ...user } = found; // never return the hash
  return { token: signToken(user.id), user };
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw HttpError.unauthorized('User no longer exists');
  return user;
}
