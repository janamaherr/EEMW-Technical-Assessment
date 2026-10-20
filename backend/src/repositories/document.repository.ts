import type { MinRole, Prisma, Visibility } from '../generated/prisma/client';
import { type Db, prisma } from './db';

export const versionSelect = {
  id: true,
  versionNumber: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  changeNote: true,
  createdAt: true,
  uploadedBy: { select: { id: true, name: true } },
} as const satisfies Prisma.DocumentVersionSelect;

/** Everything needed to render a document and to evaluate its access rules. */
export const documentDetailSelect = {
  id: true,
  title: true,
  description: true,
  visibility: true,
  minRole: true,
  uploaderId: true,
  ownerDepartmentId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  uploader: { select: { id: true, name: true, email: true } },
  ownerDepartment: { select: { id: true, name: true } },
  tags: { select: { tag: { select: { name: true } } }, orderBy: { tag: { name: 'asc' } } },
  permissions: { select: { department: { select: { id: true, name: true } } } },
  currentVersion: { select: versionSelect },
} as const satisfies Prisma.DocumentSelect;

export type DocumentDetailRow = Prisma.DocumentGetPayload<{ select: typeof documentDetailSelect }>;

export function findDocumentById(id: string, db: Db = prisma) {
  return db.document.findUnique({ where: { id }, select: documentDetailSelect });
}

/** Lighter shape for search result lists. */
export const documentListSelect = {
  id: true,
  title: true,
  description: true,
  visibility: true,
  minRole: true,
  createdAt: true,
  updatedAt: true,
  uploader: { select: { id: true, name: true } },
  ownerDepartment: { select: { id: true, name: true } },
  tags: { select: { tag: { select: { name: true } } }, orderBy: { tag: { name: 'asc' } } },
  currentVersion: { select: { versionNumber: true, mimeType: true, sizeBytes: true } },
} as const satisfies Prisma.DocumentSelect;

export type DocumentListRow = Prisma.DocumentGetPayload<{ select: typeof documentListSelect }>;

/** One page of matching documents plus the total count, read in a single transaction. */
export async function searchDocuments(
  params: {
    where: Prisma.DocumentWhereInput;
    orderBy: Prisma.DocumentOrderByWithRelationInput[];
    skip: number;
    take: number;
  },
  db: typeof prisma = prisma,
) {
  const [total, rows] = await db.$transaction([
    db.document.count({ where: params.where }),
    db.document.findMany({ ...params, select: documentListSelect }),
  ]);
  return { total, rows };
}

/** Full version history, newest first. */
export function findVersionsByDocumentId(documentId: string, db: Db = prisma) {
  return db.documentVersion.findMany({
    where: { documentId },
    orderBy: { versionNumber: 'desc' },
    select: versionSelect,
  });
}

/** Internal storage info for serving a version's file (includes the private file path). */
export function findVersionFile(versionId: string, db: Db = prisma) {
  return db.documentVersion.findUnique({
    where: { id: versionId },
    select: {
      id: true,
      documentId: true,
      versionNumber: true,
      filePath: true,
      originalFilename: true,
      mimeType: true,
      sizeBytes: true,
    },
  });
}

export function createDocument(
  data: {
    id: string;
    title: string;
    description: string | null;
    visibility: Visibility;
    minRole: MinRole;
    uploaderId: string;
    ownerDepartmentId: string;
    tagIds: string[];
    allowedDepartmentIds: string[];
  },
  db: Db = prisma,
) {
  const { tagIds, allowedDepartmentIds, ...fields } = data;
  return db.document.create({
    data: {
      ...fields,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
      permissions: { create: allowedDepartmentIds.map((departmentId) => ({ departmentId })) },
    },
    select: { id: true },
  });
}

/**
 * Locks the document row until the surrounding transaction ends, so concurrent version uploads
 * (or a concurrent soft delete) are serialized and can't pick the same version number.
 */
export async function lockDocument(id: string, db: Db) {
  await db.$queryRaw`SELECT id FROM documents WHERE id = ${id}::uuid FOR UPDATE`;
}

export async function getMaxVersionNumber(documentId: string, db: Db = prisma) {
  const result = await db.documentVersion.aggregate({
    where: { documentId },
    _max: { versionNumber: true },
  });
  return result._max.versionNumber ?? 0;
}

export function createVersion(
  data: {
    documentId: string;
    versionNumber: number;
    filePath: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    uploadedById: string;
    changeNote: string | null;
  },
  db: Db = prisma,
) {
  return db.documentVersion.create({ data, select: versionSelect });
}

export function setCurrentVersion(documentId: string, versionId: string, db: Db = prisma) {
  return db.document.update({
    where: { id: documentId },
    data: { currentVersionId: versionId },
    select: { id: true },
  });
}

export function softDeleteDocument(id: string, db: Db = prisma) {
  return db.document.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
}
