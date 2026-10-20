import type { Request, Response } from 'express';
import { getAuthUser } from '../middleware/auth';
import * as documentService from '../services/document.service';
import { HttpError } from '../utils/httpError';
import {
  type CreateDocumentInput,
  type CreateVersionInput,
  documentIdSchema,
} from '../validators/document.schemas';

function requireFile(req: Request) {
  if (!req.file) {
    throw HttpError.validation(
      [{ field: 'file', message: 'file is required' }],
      'file is required',
    );
  }
  return req.file;
}

function parseDocumentId(req: Request) {
  const result = documentIdSchema.safeParse(req.params.id);
  if (!result.success) throw HttpError.badRequest('Invalid document id');
  return result.data;
}

export async function createDocument(req: Request, res: Response) {
  const document = await documentService.createDocument(
    getAuthUser(req),
    req.body as CreateDocumentInput,
    requireFile(req),
  );
  res.status(201).location(`/api/documents/${document.id}`).json({ document });
}

export async function addVersion(req: Request, res: Response) {
  const documentId = parseDocumentId(req);
  const version = await documentService.addVersion(
    getAuthUser(req),
    documentId,
    req.body as CreateVersionInput,
    requireFile(req),
  );
  res.status(201).json({ version });
}

export async function deleteDocument(req: Request, res: Response) {
  await documentService.deleteDocument(getAuthUser(req), parseDocumentId(req));
  res.status(204).end();
}
