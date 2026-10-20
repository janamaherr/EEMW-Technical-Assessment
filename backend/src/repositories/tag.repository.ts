import { type Db, prisma } from './db';

export function findAllTagNames(db: Db = prisma) {
  return db.tag
    .findMany({ select: { name: true }, orderBy: { name: 'asc' } })
    .then((tags) => tags.map((t) => t.name));
}

/**
 * Returns the tags with the given (already normalized) names, creating any that don't exist.
 * `skipDuplicates` maps to ON CONFLICT DO NOTHING, so concurrent uploads creating the same
 * new tag don't fail.
 */
export async function findOrCreateTags(names: string[], db: Db = prisma) {
  if (names.length === 0) return [];
  await db.tag.createMany({ data: names.map((name) => ({ name })), skipDuplicates: true });
  return db.tag.findMany({ where: { name: { in: names } }, select: { id: true, name: true } });
}
