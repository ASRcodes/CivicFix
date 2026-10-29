import { getConfig } from '../config/env.js';
import { User } from '../models/User.js';
import { verifyToken } from '../services/tokenService.js';
import { ApiError } from '../utils/ApiError.js';

function extractToken(req) {
  const { cookie } = getConfig();
  if (req.cookies && req.cookies[cookie.name]) return req.cookies[cookie.name];
  // Bearer tokens are accepted for API clients such as Postman and automated tests.
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

async function resolveUser(req) {
  const token = extractToken(req);
  if (!token) return null;
  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Invalid authentication token');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');
  return user;
}

/** Requires a valid session. Sets req.user (always re-read from DB so role/active changes apply immediately). */
export async function authenticate(req, _res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) throw ApiError.unauthorized();
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Like authenticate, but anonymous requests are allowed through. */
export async function optionalAuth(req, _res, next) {
  try {
    req.user = (await resolveUser(req)) || null;
    next();
  } catch {
    req.user = null;
    next();
  }
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};
