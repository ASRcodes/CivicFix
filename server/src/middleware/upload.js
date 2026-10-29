import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { getConfig } from '../config/env.js';
import { ALLOWED_IMAGE_TYPES } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { UPLOAD_DIR, removeUpload, verifyImageFile } from '../services/fileService.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Never trust the client filename: generate a random one with a safe extension.
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype] || '.bin';
    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
    return cb(ApiError.badRequest('Only JPEG, PNG or WebP images are allowed'));
  }
  return cb(null, true);
}

/** Accepts one optional image in the "image" field, then verifies its real content type. */
export function imageUpload(req, res, next) {
  const { maxUploadBytes } = getConfig();
  const handler = multer({ storage, fileFilter, limits: { fileSize: maxUploadBytes, files: 1, fields: 20 } }).single('image');

  handler(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE'
          ? `Image is too large. Maximum size is ${(maxUploadBytes / 1024 / 1024).toFixed(1)} MB`
          : `Upload error: ${err.message}`;
        return next(ApiError.badRequest(message));
      }
      return next(err);
    }
    if (!req.file) return next();
    try {
      const ok = await verifyImageFile(req.file.path, req.file.mimetype);
      if (!ok) {
        await removeUpload(path.basename(req.file.path));
        return next(ApiError.badRequest('The uploaded file is not a valid image'));
      }
      return next();
    } catch (e) {
      return next(e);
    }
  });
}

/** Removes an uploaded file if the request ends in an error (no orphaned files). */
export function cleanupUploadOnError(err, req, _res, next) {
  if (req.file) removeUpload(req.file.filename);
  next(err);
}
