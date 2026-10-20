import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { config } from '../config/env';
import { tempUploadDir } from '../services/storage.service';
import { ALLOWED_EXTENSIONS, isAllowedFile } from '../utils/fileTypes';
import { HttpError } from '../utils/httpError';

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(tempUploadDir, { recursive: true });
      cb(null, tempUploadDir);
    },
    // Random temp name: the client's filename is never used as a path.
    filename: (_req, _file, cb) => cb(null, randomUUID()),
  }),
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 1,
    fields: 20,
    fieldSize: 64 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    // Multer decodes multipart filenames as latin1; re-decode so non-ASCII names survive.
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    if (!isAllowedFile(file.originalname, file.mimetype)) {
      cb(
        HttpError.unsupportedFileType(
          `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')} ` +
            '(extension and content type must match)',
        ),
      );
      return;
    }
    cb(null, true);
  },
});

/**
 * Parses a multipart request with a single `file` field into a temp file. The temp file is
 * removed once the response is sent, so validation errors or failed requests never leave
 * files behind (on success the service has already moved it into permanent storage).
 */
export function uploadSingleFile(req: Request, res: Response, next: NextFunction) {
  res.on('close', () => {
    if (req.file?.path) fs.rm(req.file.path, { force: true }, () => {});
  });
  upload.single('file')(req, res, next);
}
