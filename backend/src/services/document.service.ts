import { randomUUID } from 'node:crypto';
import { Role, Visibility } from '../generated/prisma/client';
import { findMissingDepartmentIds } from '../repositories/department.repository';
import {
  createDocument as insertDocument,
  createVersion,
  type DocumentDetailRow,
  findDocumentById,
  getMaxVersionNumber,
  lockDocument,
  setCurrentVersion,
  softDeleteDocument,
} from '../repositories/document.repository';
import { prisma } from '../repositories/db';
import { findOrCreateTags } from '../repositories/tag.repository';
import type { AuthUser } from '../types/auth';
import { contentMatchesExtension, getExtension, ALLOWED_FILE_TYPES } from '../utils/fileTypes';
import { HttpError } from '../utils/httpError';
import type { CreateDocumentInput, CreateVersionInput } from '../validators/document.schemas';
import { toAccessDocument, toDocumentResponse } from './document.mapper';
import { canEditDocument, canViewDocument } from './documentAccess';
import { buildVersionPath, moveIntoStorage, removeFromStorage } from './storage.service';

/** The uploaded file as produced by the upload middleware. */
export interface UploadedFile {
  path: string; // temp path
  originalname: string;
  size: number;
}

/** Verifies the file's content matches its extension and returns the normalized type info. */
async function inspectFile(file: UploadedFile) {
  const ext = getExtension(file.originalname);
  if (!(await contentMatchesExtension(file.path, ext))) {
    throw HttpError.unsupportedFileType(`File content does not match the .${ext} extension`);
  }
  return {
    ext,
    mimeType: ALLOWED_FILE_TYPES[ext].mime,
    // Keep only the base name, capped to a sane length; it is display metadata only.
    originalFilename: file.originalname.replace(/^.*[\\/]/, '').slice(-255),
    sizeBytes: file.size,
  };
}

/**
 * Loads a document the user is allowed to modify. Unknown, soft-deleted and not-visible
 * documents all return 404 (so restricted documents don't leak their existence);
 * visible-but-not-editable returns 403.
 */
async function getEditableDocument(user: AuthUser, documentId: string): Promise<DocumentDetailRow> {
  const doc = await findDocumentById(documentId);
  if (!doc || !canViewDocument(user, toAccessDocument(doc))) {
    throw HttpError.notFound('Document not found');
  }
  if (!canEditDocument(user, toAccessDocument(doc))) {
    throw HttpError.forbidden('You are not allowed to modify this document');
  }
  return doc;
}

export async function createDocument(
  user: AuthUser,
  input: CreateDocumentInput,
  file: UploadedFile,
) {
  // Owner department: chosen by ADMIN (who has no department), otherwise the uploader's own.
  let ownerDepartmentId: string;
  if (user.role === Role.ADMIN) {
    if (!input.ownerDepartmentId) {
      throw HttpError.validation(
        [{ field: 'ownerDepartmentId', message: 'ownerDepartmentId is required for admins' }],
        'ownerDepartmentId is required for admins',
      );
    }
    ownerDepartmentId = input.ownerDepartmentId;
  } else {
    if (!user.departmentId) throw HttpError.forbidden('User has no department');
    ownerDepartmentId = user.departmentId;
  }

  const allowedDepartmentIds =
    input.visibility === Visibility.RESTRICTED ? input.allowedDepartmentIds : [];

  const missing = await findMissingDepartmentIds([ownerDepartmentId, ...allowedDepartmentIds]);
  if (missing.length > 0) {
    throw HttpError.badRequest('Unknown department id(s)', { departmentIds: missing });
  }

  const fileInfo = await inspectFile(file);
  const documentId = randomUUID();
  const filePath = buildVersionPath(documentId, 1, fileInfo.ext);

  await moveIntoStorage(file.path, filePath);
  try {
    await prisma.$transaction(async (tx) => {
      const tags = await findOrCreateTags(input.tags, tx);
      await insertDocument(
        {
          id: documentId,
          title: input.title,
          description: input.description ?? null,
          visibility: input.visibility,
          minRole: input.minRole,
          uploaderId: user.id,
          ownerDepartmentId,
          tagIds: tags.map((t) => t.id),
          allowedDepartmentIds,
        },
        tx,
      );
      const version = await createVersion(
        {
          documentId,
          versionNumber: 1,
          filePath,
          originalFilename: fileInfo.originalFilename,
          mimeType: fileInfo.mimeType,
          sizeBytes: fileInfo.sizeBytes,
          uploadedById: user.id,
          changeNote: null,
        },
        tx,
      );
      await setCurrentVersion(documentId, version.id, tx);
    });
  } catch (err) {
    await removeFromStorage(filePath); // no orphan files when the DB step fails
    throw err;
  }

  const created = await findDocumentById(documentId);
  return toDocumentResponse(created!);
}

export async function addVersion(
  user: AuthUser,
  documentId: string,
  input: CreateVersionInput,
  file: UploadedFile,
) {
  await getEditableDocument(user, documentId);
  const fileInfo = await inspectFile(file);

  let filePath: string | undefined;
  try {
    const version = await prisma.$transaction(async (tx) => {
      // Serialize concurrent uploads/deletes on this document, then re-check under the lock.
      await lockDocument(documentId, tx);
      const current = await tx.document.findUnique({
        where: { id: documentId },
        select: { deletedAt: true },
      });
      if (!current || current.deletedAt) throw HttpError.notFound('Document not found');

      const versionNumber = (await getMaxVersionNumber(documentId, tx)) + 1;
      filePath = buildVersionPath(documentId, versionNumber, fileInfo.ext);
      await moveIntoStorage(file.path, filePath);

      const created = await createVersion(
        {
          documentId,
          versionNumber,
          filePath,
          originalFilename: fileInfo.originalFilename,
          mimeType: fileInfo.mimeType,
          sizeBytes: fileInfo.sizeBytes,
          uploadedById: user.id,
          changeNote: input.changeNote ?? null,
        },
        tx,
      );
      await setCurrentVersion(documentId, created.id, tx);
      return created;
    });
    return { documentId, ...version };
  } catch (err) {
    if (filePath) await removeFromStorage(filePath);
    throw err;
  }
}

export async function deleteDocument(user: AuthUser, documentId: string) {
  await getEditableDocument(user, documentId);
  // Soft delete only: rows and files are kept for history/audit.
  await softDeleteDocument(documentId);
}
