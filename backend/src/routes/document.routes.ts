import { Router } from 'express';
import * as documentController from '../controllers/document.controller';
import { requireAuth } from '../middleware/auth';
import { uploadSingleFile } from '../middleware/upload';
import { validateBody } from '../middleware/validate';
import { createDocumentSchema, createVersionSchema } from '../validators/document.schemas';

export const documentRouter = Router();

documentRouter.use(requireAuth);

// Auth runs before multer so unauthenticated uploads are rejected without receiving the file.
documentRouter.post(
  '/',
  uploadSingleFile,
  validateBody(createDocumentSchema),
  documentController.createDocument,
);
documentRouter.post(
  '/:id/versions',
  uploadSingleFile,
  validateBody(createVersionSchema),
  documentController.addVersion,
);
documentRouter.delete('/:id', documentController.deleteDocument);
