import { isDbConnected } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { stripDangerousKeys } from '../utils/sanitize.js';

export function sanitizeRequest(req, _res, next) {
  if (req.body) stripDangerousKeys(req.body);
  if (req.query) stripDangerousKeys(req.query);
  if (req.params) stripDangerousKeys(req.params);
  next();
}

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF defence for cookie-based auth: state-changing requests must carry a custom
 * header. Browsers cannot attach custom headers to cross-site form posts, and
 * cross-origin fetches with custom headers trigger a CORS preflight that our
 * CORS whitelist rejects.
 */
export function requireClientHeader(req, _res, next) {
  if (UNSAFE.has(req.method) && req.get('X-Requested-With') !== 'XMLHttpRequest') {
    return next(ApiError.forbidden('Missing X-Requested-With header'));
  }
  return next();
}

/** Returns 503 instead of hanging when the database is unavailable. */
export function requireDatabase(_req, _res, next) {
  if (!isDbConnected()) {
    return next(new ApiError(503, 'The service is temporarily unavailable (database not connected). Please try again shortly.'));
  }
  return next();
}
