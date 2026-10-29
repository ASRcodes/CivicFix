/**
 * Pure helpers for building safe MongoDB queries from request parameters.
 * Every value is coerced to a primitive string and checked against a whitelist,
 * so objects such as { $ne: null } can never reach a query.
 */
export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function toPositiveInt(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export function getPagination(query = {}, { defaultLimit = 10, maxLimit = 50 } = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = toPositiveInt(query.limit, defaultLimit, maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export function buildMeta({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export function asString(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
}

export const isObjectIdString = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);

/**
 * Builds a complaint filter from query params.
 * @param {object} query   request query
 * @param {object} allowed { statuses, categories, priorities } whitelists
 */
export function buildComplaintFilter(query = {}, allowed = {}) {
  const filter = {};

  const status = asString(query.status);
  if (status && (!allowed.statuses || allowed.statuses.includes(status))) filter.status = status;

  const category = asString(query.category);
  if (category && (!allowed.categories || allowed.categories.includes(category))) filter.category = category;

  const priority = asString(query.priority);
  if (priority && (!allowed.priorities || allowed.priorities.includes(priority))) filter.priority = priority;

  const department = asString(query.department);
  if (department && isObjectIdString(department)) filter.departmentId = department;

  const from = asString(query.from);
  const to = asString(query.to);
  const range = {};
  if (from && !Number.isNaN(Date.parse(from))) range.$gte = new Date(from);
  if (to && !Number.isNaN(Date.parse(to))) {
    const end = new Date(to);
    // A plain date (YYYY-MM-DD) means "through the end of that day"
    if (/^\d{4}-\d{2}-\d{2}$/.test(to)) end.setUTCHours(23, 59, 59, 999);
    range.$lte = end;
  }
  if (Object.keys(range).length) filter.createdAt = range;

  const search = asString(query.search);
  if (search) {
    const rx = new RegExp(escapeRegex(search.slice(0, 100)), 'i');
    filter.$or = [{ referenceNumber: rx }, { title: rx }, { city: rx }, { address: rx }];
  }

  return filter;
}

const SORTS = Object.freeze({
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  priority: { priorityWeight: -1, createdAt: -1 },
  priority_asc: { priorityWeight: 1, createdAt: -1 },
  updated: { updatedAt: -1 },
});

export const SORT_KEYS = Object.keys(SORTS);

export function buildSort(sortKey) {
  return { ...(SORTS[sortKey] || SORTS.newest) };
}

/** Copies only whitelisted keys (protection against mass assignment). */
export function pick(source = {}, keys = []) {
  const out = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) out[key] = source[key];
  }
  return out;
}
