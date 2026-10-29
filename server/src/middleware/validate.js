import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/** Runs after express-validator chains and converts errors into a 422 response. */
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.path,
    message: e.msg,
  }));
  return next(ApiError.unprocessable('Please correct the highlighted fields', errors));
}
