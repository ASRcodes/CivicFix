import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

const SIGNATURES = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/webp': (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
};

/** Checks the file's magic bytes so a renamed .exe cannot pose as an image. */
export function matchesSignature(buffer, mimeType) {
  const check = SIGNATURES[mimeType];
  return Boolean(check && buffer && buffer.length >= 12 && check(buffer));
}

export async function verifyImageFile(filePath, mimeType) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);
    return matchesSignature(buffer, mimeType);
  } finally {
    await handle.close();
  }
}

/** Resolves a stored filename safely inside UPLOAD_DIR (prevents path traversal). */
export function resolveUploadPath(filename) {
  const safeName = path.basename(String(filename || ''));
  if (!safeName || safeName !== filename) return null;
  return path.join(UPLOAD_DIR, safeName);
}

export async function removeUpload(filename) {
  const filePath = resolveUploadPath(filename);
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn(`[upload] Could not remove ${filename}: ${err.code}`);
  }
}

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}
