/**
 * The single source of truth for document access rules (see docs/database.md#access-rules).
 *
 * View = department rule AND role rule, except: ADMIN sees everything, the uploader always sees
 * their own document, and soft-deleted documents are hidden from everyone.
 *
 * Edit (add a version / soft delete): ADMIN any document; MANAGER documents owned by their
 * department; EMPLOYEE only documents they uploaded.
 */
import { MinRole, type Prisma, Role, Visibility } from '../generated/prisma/client';
import type { AuthUser } from '../types/auth';

type AccessUser = Pick<AuthUser, 'id' | 'role' | 'departmentId'>;

export interface AccessDocument {
  uploaderId: string;
  ownerDepartmentId: string;
  visibility: Visibility;
  minRole: MinRole;
  deletedAt: Date | null;
  /** Departments listed in document_permissions. */
  allowedDepartmentIds: string[];
}

function passesDepartmentRule(user: AccessUser, doc: AccessDocument): boolean {
  if (doc.visibility === Visibility.PUBLIC) return true;
  if (!user.departmentId) return false;
  return (
    doc.ownerDepartmentId === user.departmentId ||
    doc.allowedDepartmentIds.includes(user.departmentId)
  );
}

function passesRoleRule(user: AccessUser, doc: AccessDocument): boolean {
  return doc.minRole === MinRole.EMPLOYEE || user.role === Role.MANAGER;
}

export function canViewDocument(user: AccessUser, doc: AccessDocument): boolean {
  if (doc.deletedAt) return false;
  if (user.role === Role.ADMIN) return true;
  if (doc.uploaderId === user.id) return true;
  return passesDepartmentRule(user, doc) && passesRoleRule(user, doc);
}

export function canEditDocument(user: AccessUser, doc: AccessDocument): boolean {
  if (doc.deletedAt) return false;
  switch (user.role) {
    case Role.ADMIN:
      return true;
    case Role.MANAGER:
      return user.departmentId !== null && doc.ownerDepartmentId === user.departmentId;
    case Role.EMPLOYEE:
      return doc.uploaderId === user.id;
  }
}

/**
 * The view rule expressed as a Prisma `where` filter, so lists and search can filter in the
 * database (keeping pagination correct) with exactly the same semantics as canViewDocument.
 */
export function visibleDocumentsWhere(user: AccessUser): Prisma.DocumentWhereInput {
  const notDeleted: Prisma.DocumentWhereInput = { deletedAt: null };
  if (user.role === Role.ADMIN) return notDeleted;

  const departmentRule: Prisma.DocumentWhereInput[] = [{ visibility: Visibility.PUBLIC }];
  if (user.departmentId) {
    departmentRule.push(
      { ownerDepartmentId: user.departmentId },
      { permissions: { some: { departmentId: user.departmentId } } },
    );
  }

  const roleRule: Prisma.DocumentWhereInput =
    user.role === Role.MANAGER ? {} : { minRole: MinRole.EMPLOYEE };

  return {
    ...notDeleted,
    OR: [{ uploaderId: user.id }, { AND: [{ OR: departmentRule }, roleRule] }],
  };
}
