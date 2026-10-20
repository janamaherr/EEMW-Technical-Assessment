/**
 * Read side of documents: search, details, version history and file access.
 * Every function enforces canViewDocument; anything the user may not see is reported as 404
 * (never 403), so restricted documents don't reveal that they exist.
 */
import type { Prisma } from '../generated/prisma/client';
import {
  type DocumentDetailRow,
  findDocumentById,
  findVersionFile,
  findVersionsByDocumentId,
  searchDocuments as searchDocumentRows,
} from '../repositories/document.repository';
import type { AuthUser } from '../types/auth';
import { HttpError } from '../utils/httpError';
import type { FileQuery, SearchDocumentsQuery } from '../validators/document.schemas';
import { toAccessDocument, toDocumentListItem, toDocumentResponse } from './document.mapper';
import { canEditDocument, canViewDocument, visibleDocumentsWhere } from './documentAccess';
import { cachedSearch } from './searchCache.service';
import { resolveStoragePath, storedFileExists } from './storage.service';

/** MIME types a browser can safely display inline; everything else is always downloaded. */
const INLINE_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'text/plain']);

const notFound = () => HttpError.notFound('Document not found');

async function getViewableDocument(user: AuthUser, documentId: string): Promise<DocumentDetailRow> {
  const doc = await findDocumentById(documentId);
  if (!doc || !canViewDocument(user, toAccessDocument(doc))) throw notFound();
  return doc;
}

export async function searchDocuments(user: AuthUser, query: SearchDocumentsQuery) {
  return cachedSearch(user, query, async () => {
    // Access rules are part of the WHERE clause, so total and pagination only ever count
    // documents this user may see.
    const conditions: Prisma.DocumentWhereInput[] = [visibleDocumentsWhere(user)];
    if (query.q) {
      // Compiles to `title ILIKE '%q%'`, served by the GIN trigram index on documents.title.
      conditions.push({ title: { contains: query.q, mode: 'insensitive' } });
    }
    if (query.tags.length > 0) {
      conditions.push({ tags: { some: { tag: { name: { in: query.tags } } } } });
    }
    if (query.uploaderId) conditions.push({ uploaderId: query.uploaderId });
    if (query.mine) conditions.push({ uploaderId: user.id });

    const orderBy: Prisma.DocumentOrderByWithRelationInput[] =
      query.sort === 'title'
        ? [{ title: 'asc' }, { id: 'asc' }]
        : [{ createdAt: 'desc' }, { id: 'asc' }]; // id = stable tie-breaker for paging

    const { total, rows } = await searchDocumentRows({
      where: { AND: conditions },
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return {
      items: rows.map(toDocumentListItem),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  });
}

export async function getDocument(user: AuthUser, documentId: string) {
  const doc = await getViewableDocument(user, documentId);
  return {
    ...toDocumentResponse(doc),
    canEdit: canEditDocument(user, toAccessDocument(doc)),
  };
}

export async function getVersionHistory(user: AuthUser, documentId: string) {
  const doc = await getViewableDocument(user, documentId);
  const versions = await findVersionsByDocumentId(documentId);
  return versions.map((v) => ({ ...v, isCurrent: v.id === doc.currentVersion?.id }));
}

export interface FileDownload {
  absolutePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  disposition: 'inline' | 'attachment';
}

/**
 * Resolves the file for a document's current version (no versionId) or a specific version.
 * 404 when the document isn't viewable, the version belongs to another document, or the file
 * is missing on disk.
 */
export async function getVersionFile(
  user: AuthUser,
  documentId: string,
  versionId: string | undefined,
  query: FileQuery,
): Promise<FileDownload> {
  const doc = await getViewableDocument(user, documentId);

  const targetVersionId = versionId ?? doc.currentVersion?.id;
  const version = targetVersionId ? await findVersionFile(targetVersionId) : null;
  if (!version || version.documentId !== doc.id) {
    throw HttpError.notFound('Version not found');
  }

  const absolutePath = resolveStoragePath(version.filePath);
  if (!(await storedFileExists(absolutePath))) {
    throw HttpError.notFound('File not found');
  }

  const canInline = INLINE_MIME_TYPES.has(version.mimeType);
  return {
    absolutePath,
    filename: version.originalFilename,
    mimeType: version.mimeType,
    sizeBytes: version.sizeBytes,
    disposition: query.disposition === 'inline' && canInline ? 'inline' : 'attachment',
  };
}
