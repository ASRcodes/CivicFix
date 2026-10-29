import dotenv from 'dotenv';

dotenv.config();

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];

function parseList(value, fallback) {
  if (!value || !String(value).trim()) return fallback;
  return String(value).split(',').map((v) => v.trim()).filter(Boolean);
}

/**
 * Validates configuration and returns a frozen config object.
 * Error messages name the variables but never print their values.
 */
export function loadConfig(source = process.env) {
  const nodeEnv = source.NODE_ENV || 'development';
  const problems = REQUIRED.filter((key) => !source[key] || !String(source[key]).trim())
    .map((key) => `${key} is not set`);

  const jwtSecret = source.JWT_SECRET || '';
  if (jwtSecret && jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters long');
  }
  if (nodeEnv === 'production' && /replace-with/i.test(jwtSecret)) {
    problems.push('JWT_SECRET still contains the example placeholder value');
  }

  const sameSite = String(source.COOKIE_SAME_SITE || 'lax').toLowerCase();
  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    problems.push('COOKIE_SAME_SITE must be one of: lax, strict, none');
  }
  const cookieSecure = String(source.COOKIE_SECURE || 'false').toLowerCase() === 'true';
  if (sameSite === 'none' && !cookieSecure) {
    problems.push('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true (browsers reject it otherwise)');
  }

  const maxUploadMb = Number(source.MAX_UPLOAD_MB || 2);
  if (!Number.isFinite(maxUploadMb) || maxUploadMb <= 0 || maxUploadMb > 10) {
    problems.push('MAX_UPLOAD_MB must be a number greater than 0 and at most 10');
  }

  if (problems.length) {
    const error = new Error(`Invalid server configuration:\n  - ${problems.join('\n  - ')}`);
    error.code = 'CONFIG_INVALID';
    throw error;
  }

  return Object.freeze({
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    port: Number(source.PORT || 5000),
    mongoUri: source.MONGODB_URI,
    jwtSecret,
    jwtExpiresIn: source.JWT_EXPIRES_IN || '1d',
    clientOrigins: parseList(source.CLIENT_ORIGIN, ['http://localhost:5173']),
    cookie: Object.freeze({
      name: 'civicfix_token',
      secure: cookieSecure,
      sameSite,
      domain: source.COOKIE_DOMAIN || undefined,
    }),
    maxUploadBytes: Math.round(maxUploadMb * 1024 * 1024),
    citizenEditableStatuses: parseList(source.CITIZEN_EDITABLE_STATUSES, ['Pending']),
    trustProxy: String(source.TRUST_PROXY || 'false').toLowerCase() === 'true',
  });
}

let cached;
export function getConfig() {
  if (!cached) cached = loadConfig();
  return cached;
}

/** Test helper: clears the cached config after environment changes. */
export function resetConfigCache() {
  cached = undefined;
}
