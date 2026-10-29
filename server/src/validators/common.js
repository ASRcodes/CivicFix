import { param, query } from 'express-validator';
import { SORT_KEYS } from '../utils/query.js';

export const objectIdParam = (name = 'id') =>
  param(name).isMongoId().withMessage(`Invalid ${name}`);

/** Shared validators for list endpoints; values must be plain strings. */
export const listQuery = [
  query('page').optional().isInt({ min: 1, max: 100000 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
  query('search').optional().isString().withMessage('search must be text').trim().isLength({ max: 100 }),
  query('sort').optional().isIn(SORT_KEYS).withMessage(`sort must be one of: ${SORT_KEYS.join(', ')}`),
  query('from').optional({ values: 'falsy' }).isISO8601().withMessage('from must be a date (YYYY-MM-DD)'),
  query('to').optional({ values: 'falsy' }).isISO8601().withMessage('to must be a date (YYYY-MM-DD)'),
];
