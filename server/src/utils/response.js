/**
 * Consistent JSON envelope:
 *   success: { success: true, message?, data, meta? }
 *   error:   { success: false, message, errors? }   (see middleware/error.js)
 */
export function sendSuccess(res, { status = 200, message, data = null, meta } = {}) {
  const body = { success: true };
  if (message) body.message = message;
  body.data = data;
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}
