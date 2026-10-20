import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { loginSchema, signupSchema } from '../validators/auth.schemas';

export const authRouter = Router();

authRouter.post('/signup', validateBody(signupSchema), authController.signup);
authRouter.post('/login', validateBody(loginSchema), authController.login);
authRouter.get('/me', requireAuth, authController.me);
