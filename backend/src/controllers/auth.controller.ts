import type { Request, Response } from 'express';
import { getAuthUser } from '../middleware/auth';
import * as authService from '../services/auth.service';
import type { LoginInput, SignupInput } from '../validators/auth.schemas';

export async function signup(req: Request, res: Response) {
  const result = await authService.signup(req.body as SignupInput);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body as LoginInput);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(getAuthUser(req).id);
  res.json({ user });
}
