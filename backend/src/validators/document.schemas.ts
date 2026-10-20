import { z } from 'zod';
import { MinRole, Visibility } from '../generated/prisma/client';

export const MAX_TAGS = 10;

/**
 * Multipart fields arrive as strings. List fields accept a JSON array (`["a","b"]`),
 * a comma-separated string (`a, b`), or the field repeated (multer gives an array).
 * Unparseable JSON is passed through unchanged so the array schema reports it.
 */
function parseList(value: unknown): unknown {
  if (value === undefined || value === null) return [];
  const items = Array.isArray(value) ? value : [value];
  const result: unknown[] = [];
  for (const item of items) {
    if (typeof item !== 'string') return value;
    const trimmed = item.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) return value;
        result.push(...parsed);
      } catch {
        return value;
      }
    } else {
      result.push(...trimmed.split(','));
    }
  }
  // Drop empty entries such as the gaps in "a,,b" or a trailing comma.
  return result.filter((v) => !(typeof v === 'string' && v.trim() === ''));
}

const listOf = <T extends z.ZodType>(item: T) =>
  z.preprocess(
    parseList,
    z
      .array(item, 'Expected a JSON array or a comma-separated list')
      .transform((list) => [...new Set(list)]),
  );

/** Empty strings from form fields mean "not provided". */
const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max).optional(),
  );

const upperCase = (v: unknown) => (typeof v === 'string' ? v.trim().toUpperCase() : v);

export const createDocumentSchema = z
  .object({
    title: z.string('Title is required').trim().min(1, 'Title is required').max(200),
    description: optionalText(2000),
    tags: listOf(z.string().trim().toLowerCase().min(1).max(50)).pipe(
      z.array(z.string()).max(MAX_TAGS, `At most ${MAX_TAGS} tags are allowed`),
    ),
    visibility: z.preprocess(upperCase, z.enum(Visibility).default(Visibility.PUBLIC)),
    allowedDepartmentIds: listOf(z.uuid('Department ids must be valid UUIDs')),
    minRole: z.preprocess(upperCase, z.enum(MinRole).default(MinRole.EMPLOYEE)),
    ownerDepartmentId: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.uuid('ownerDepartmentId must be a valid UUID').optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.visibility === Visibility.RESTRICTED && data.allowedDepartmentIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['allowedDepartmentIds'],
        message: 'At least one department is required for RESTRICTED documents',
      });
    }
  });

export const createVersionSchema = z.object({
  changeNote: optionalText(500),
});

export const documentIdSchema = z.uuid('Invalid document id');

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
