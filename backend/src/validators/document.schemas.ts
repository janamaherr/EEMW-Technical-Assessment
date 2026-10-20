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
export const versionIdSchema = z.uuid('Invalid version id');

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

export const SEARCH_SORTS = ['newest', 'title'] as const;

/** Query string for GET /api/documents. Unknown params are ignored. */
export const searchDocumentsSchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()).transform(
    (v) => v || undefined, // whitespace-only search == no search
  ),
  // Comma-separated; documents matching ANY of the tags. Sorted so the cache key is stable.
  tags: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .optional()
      .transform((v) =>
        [
          ...new Set(
            (v ?? '')
              .split(',')
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean),
          ),
        ].sort(),
      )
      .pipe(z.array(z.string().max(50)).max(MAX_TAGS, `At most ${MAX_TAGS} tags are allowed`)),
  ),
  uploaderId: z.preprocess(emptyToUndefined, z.uuid('uploaderId must be a valid UUID').optional()),
  mine: z
    .preprocess(
      emptyToUndefined,
      z.enum(['true', 'false'], 'mine must be true or false').default('false'),
    )
    .transform((v) => v === 'true'),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(SEARCH_SORTS, `sort must be one of: ${SEARCH_SORTS.join(', ')}`).default('newest'),
  ),
  page: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int('page must be an integer').min(1, 'page must be at least 1').default(1),
  ),
  pageSize: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int('pageSize must be an integer')
      .min(1, 'pageSize must be at least 1')
      .max(50, 'pageSize must be at most 50')
      .default(10),
  ),
});

export const fileQuerySchema = z.object({
  disposition: z.preprocess(
    emptyToUndefined,
    z
      .enum(['inline', 'attachment'], 'disposition must be inline or attachment')
      .default('attachment'),
  ),
});

export type SearchDocumentsQuery = z.infer<typeof searchDocumentsSchema>;
export type FileQuery = z.infer<typeof fileQuerySchema>;

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
