import mongoose from 'mongoose';
import { getConfig } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl.split('?')[0]}`));
}

/** Centralized error handler: consistent JSON, no stack traces or internals in production. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const { isProduction } = getConfig();
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    message = 'Please correct the highlighted fields';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err && err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || 'field';
    message = field === 'email' ? 'An account with this email already exists' : `A record with this ${field} already exists`;
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
    status = 503;
    message = 'The service is temporarily unavailable. Please try again shortly.';
  }

  if (status >= 500) {
    // Log server-side only. Request bodies are never logged (they may contain passwords).
    console.error(`[error] ${req.method} ${req.originalUrl.split('?')[0]} -> ${status}: ${err.message}`);
    if (!isProduction && err.stack) console.error(err.stack);
    if (isProduction && !(err instanceof ApiError)) message = 'Internal server error';
  }

  const body = { success: false, message };
  if (errors && errors.length) body.errors = errors;
  if (!isProduction && status >= 500 && err.stack) body.stack = err.stack.split('\n').slice(0, 5);
  res.status(status).json(body);
}
