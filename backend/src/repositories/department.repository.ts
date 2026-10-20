import { type Db, prisma } from './db';

export function findAllDepartments(db: Db = prisma) {
  return db.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
}

export function departmentExists(id: string, db: Db = prisma) {
  return db.department.count({ where: { id } }).then((n) => n > 0);
}

/** Returns the subset of `ids` that do not exist. */
export async function findMissingDepartmentIds(ids: string[], db: Db = prisma) {
  const found = await db.department.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const existing = new Set(found.map((d) => d.id));
  return ids.filter((id) => !existing.has(id));
}
