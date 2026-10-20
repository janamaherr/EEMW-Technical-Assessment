import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth';

export const userRouter = Router();

userRouter.get('/', requireAuth, userController.listUsers);
