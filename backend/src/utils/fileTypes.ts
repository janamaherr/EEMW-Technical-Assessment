import fs from 'node:fs/promises';
import path from 'node:path';

interface AllowedType {
  /** Canonical MIME type stored in the database. */
  mime: string;
  /** MIME types browsers/clients send for this extension. */
  acceptedMimes: string[];
  /** Checks the file's leading bytes ("magic number") so a renamed file can't slip through. */
  matchesContent: (head: Buffer) => boolean;
}

const startsWith = (bytes: number[]) => (head: Buffer) =>
  head.length >= bytes.length && bytes.every((b, i) => head[i] === b);

const PDF = startsWith([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
const PNG = startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = startsWith([0xff, 0xd8, 0xff]);
const ZIP = startsWith([0x50, 0x4b, 0x03, 0x04]); // DOCX/XLSX are ZIP containers
const TEXT = (head: Buffer) => !head.includes(0x00); // no NUL bytes => plausibly text

// Browsers without Office installed (e.g. Chrome/Edge on a bare Windows machine) often send
// Office files as application/octet-stream. Accept that for DOCX/XLSX only; the ZIP content
// check below still rejects anything that is not actually an Office container.
const GENERIC_BINARY = 'application/octet-stream';

const JPEG_TYPE: AllowedType = {
  mime: 'image/jpeg',
  acceptedMimes: ['image/jpeg'],
  matchesContent: JPEG,
};

export const ALLOWED_FILE_TYPES: Record<string, AllowedType> = {
  pdf: { mime: 'application/pdf', acceptedMimes: ['application/pdf'], matchesContent: PDF },
  docx: {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    acceptedMimes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      GENERIC_BINARY,
    ],
    matchesContent: ZIP,
  },
  xlsx: {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    acceptedMimes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      GENERIC_BINARY,
    ],
    matchesContent: ZIP,
  },
  txt: { mime: 'text/plain', acceptedMimes: ['text/plain'], matchesContent: TEXT },
  png: { mime: 'image/png', acceptedMimes: ['image/png'], matchesContent: PNG },
  jpg: JPEG_TYPE,
  jpeg: JPEG_TYPE,
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_FILE_TYPES);

export function getExtension(filename: string): string {
  return path.extname(filename).slice(1).toLowerCase();
}

/** True when the extension is allowed and the declared MIME type matches it. */
export function isAllowedFile(originalName: string, mimeType: string): boolean {
  const type = ALLOWED_FILE_TYPES[getExtension(originalName)];
  const baseMime = mimeType.split(';')[0].trim().toLowerCase();
  return !!type && type.acceptedMimes.includes(baseMime);
}

/** Reads the start of a saved file and checks it against the expected signature. */
export async function contentMatchesExtension(filePath: string, ext: string): Promise<boolean> {
  const type = ALLOWED_FILE_TYPES[ext];
  if (!type) return false;
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(8192);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return type.matchesContent(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}
