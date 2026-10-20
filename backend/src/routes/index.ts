import { Router } from 'express';
import { authRouter } from './auth.routes';
import { departmentRouter } from './department.routes';
import { documentRouter } from './document.routes';
import { healthRouter } from './health.routes';
import { tagRouter } from './tag.routes';
import { userRouter } from './user.routes';

/** All API routes, mounted under /api in app.ts. */
export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/departments', departmentRouter);
router.use('/documents', documentRouter);
router.use('/users', userRouter);
router.use('/tags', tagRouter);
