import { body, query } from 'express-validator';
import { STATUSES } from '../utils/constants.js';
import { listQuery, objectIdParam } from './common.js';

export const statusChangeRules = [
  objectIdParam('id'),
  body('status').isIn(STATUSES).withMessage('Choose a valid status'),
  body('publicMessage').optional().isString().trim().isLength({ max: 1000 }).withMessage('Message must be at most 1000 characters'),
  body('internalNote').optional().isString().trim().isLength({ max: 1000 }).withMessage('Note must be at most 1000 characters'),
];

export const assignRules = [
  objectIdParam('id'),
  body('departmentId')
    .optional({ values: 'null' })
    .custom((v) => v === '' || /^[a-f\d]{24}$/i.test(String(v)))
    .withMessage('Invalid department'),
  body('assignedTo').optional().isString().trim().isLength({ max: 100 }).withMessage('Staff name must be at most 100 characters'),
  body('internalNote').optional().isString().trim().isLength({ max: 1000 }),
  body().custom((_v, { req }) => {
    if (req.body.departmentId === undefined && req.body.assignedTo === undefined) {
      throw new Error('Provide a department and/or a staff member');
    }
    return true;
  }),
];

export const userListRules = [
  ...listQuery,
  query('role').optional({ values: 'falsy' }).isIn(['citizen', 'admin']).withMessage('Invalid role filter'),
  query('active').optional({ values: 'falsy' }).isIn(['true', 'false']).withMessage('active must be true or false'),
];

export const userStatusRules = [
  objectIdParam('id'),
  body('isActive').isBoolean().withMessage('isActive must be true or false').toBoolean(),
];

export const departmentCreateRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description must be at most 500 characters'),
];

export const departmentUpdateRules = [
  objectIdParam('id'),
  body('name').optional().isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description must be at most 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
];
