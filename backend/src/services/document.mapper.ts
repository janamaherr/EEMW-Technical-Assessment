import type { DocumentDetailRow } from '../repositories/document.repository';
import type { AccessDocument } from './documentAccess';

/** Shape used by the access rules. */
export function toAccessDocument(row: DocumentDetailRow): AccessDocument {
  return {
    uploaderId: row.uploaderId,
    ownerDepartmentId: row.ownerDepartmentId,
    visibility: row.visibility,
    minRole: row.minRole,
    deletedAt: row.deletedAt,
    allowedDepartmentIds: row.permissions.map((p) => p.department.id),
  };
}

/** API representation of a document. Storage paths are internal and never exposed. */
export function toDocumentResponse(row: DocumentDetailRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    minRole: row.minRole,
    ownerDepartment: row.ownerDepartment,
    uploader: row.uploader,
    tags: row.tags.map((t) => t.tag.name),
    allowedDepartments: row.permissions
      .map((p) => p.department)
      .sort((a, b) => a.name.localeCompare(b.name)),
    currentVersion: row.currentVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
