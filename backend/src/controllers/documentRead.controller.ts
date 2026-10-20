import contentDisposition from 'content-disposition';
import type { Request, Response } from 'express';
import { getAuthUser } from '../middleware/auth';
import * as documentReadService from '../services/documentRead.service';
import { HttpError } from '../utils/httpError';
import {
  documentIdSchema,
  fileQuerySchema,
  searchDocumentsSchema,
  versionIdSchema,
} from '../validators/document.schemas';

function parseDocumentId(req: Request) {
  const result = documentIdSchema.safeParse(req.params.id);
  if (!result.success) throw HttpError.badRequest('Invalid document id');
  return result.data;
}

function parseVersionId(req: Request) {
  const result = versionIdSchema.safeParse(req.params.versionId);
  if (!result.success) throw HttpError.badRequest('Invalid version id');
  return result.data;
}

export async function searchDocuments(req: Request, res: Response) {
  const query = searchDocumentsSchema.parse(req.query); // ZodError -> 400 with details
  const { data, cache } = await documentReadService.searchDocuments(getAuthUser(req), query);
  res.setHeader('X-Cache', cache);
  res.json(data);
}

export async function getDocument(req: Request, res: Response) {
  const document = await documentReadService.getDocument(getAuthUser(req), parseDocumentId(req));
  res.json({ document });
}

export async function getVersionHistory(req: Request, res: Response) {
  const versions = await documentReadService.getVersionHistory(
    getAuthUser(req),
    parseDocumentId(req),
  );
  res.json({ versions });
}

async function sendVersionFile(req: Request, res: Response, versionId: string | undefined) {
  const file = await documentReadService.getVersionFile(
    getAuthUser(req),
    parseDocumentId(req),
    versionId,
    fileQuerySchema.parse(req.query),
  );

  res.setHeader(
    'Content-Type',
    file.mimeType === 'text/plain' ? 'text/plain; charset=utf-8' : file.mimeType,
  );
  res.setHeader(
    'Content-Disposition',
    contentDisposition(file.filename, { type: file.disposition }),
  );
  // Access depends on the user, so shared caches must never store it.
  res.setHeader('Cache-Control', 'private, no-store');

  // sendFile streams from disk (with Range support for PDF viewers).
  await new Promise<void>((resolve, reject) => {
    res.sendFile(file.absolutePath, { dotfiles: 'allow' }, (err) => {
      if (err && !res.headersSent) reject(HttpError.notFound('File not found'));
      else resolve(); // client aborted mid-stream: nothing left to send
    });
  });
}

export async function downloadCurrentFile(req: Request, res: Response) {
  await sendVersionFile(req, res, undefined);
}

export async function downloadVersionFile(req: Request, res: Response) {
  await sendVersionFile(req, res, parseVersionId(req));
}
