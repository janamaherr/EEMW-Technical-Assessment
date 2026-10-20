import { Router } from 'express';
import * as documentController from '../controllers/document.controller';
import * as documentReadController from '../controllers/documentRead.controller';
import { requireAuth } from '../middleware/auth';
import { uploadSingleFile } from '../middleware/upload';
import { validateBody } from '../middleware/validate';
import { createDocumentSchema, createVersionSchema } from '../validators/document.schemas';

export const documentRouter = Router();

documentRouter.use(requireAuth);

// Read
documentRouter.get('/', documentReadController.searchDocuments);
documentRouter.get('/:id', documentReadController.getDocument);
documentRouter.get('/:id/versions', documentReadController.getVersionHistory);
documentRouter.get('/:id/file', documentReadController.downloadCurrentFile);
documentRouter.get('/:id/versions/:versionId/file', documentReadController.downloadVersionFile);

// Write. Auth runs before multer so unauthenticated uploads are rejected without receiving
// the file.
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
