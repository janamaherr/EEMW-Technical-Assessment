import { Router } from 'express';
import * as tagController from '../controllers/tag.controller';
import { requireAuth } from '../middleware/auth';

export const tagRouter = Router();

tagRouter.get('/', requireAuth, tagController.listTags);
