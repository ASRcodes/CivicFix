import { body, param, query } from 'express-validator';
import { CATEGORIES, PRIORITIES, STATUSES } from '../utils/constants.js';
import { listQuery, objectIdParam } from './common.js';

const coordinate = (field, min, max) =>
  body(field)
    .optional({ values: 'falsy' })
    .isFloat({ min, max })
    .withMessage(`${field} must be a number between ${min} and ${max}`)
    .toFloat();

const complaintFields = (optional) => {
  const maybe = (chain) => (optional ? chain.optional() : chain);
  return [
    maybe(body('title')).isString().trim().isLength({ min: 5, max: 120 }).withMessage('Title must be 5-120 characters'),
    maybe(body('description')).isString().trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
    maybe(body('category')).isIn(CATEGORIES).withMessage('Choose a valid category'),
    body('priority').optional().isIn(PRIORITIES).withMessage('Choose a valid priority'),
    maybe(body('address')).isString().trim().isLength({ min: 5, max: 250 }).withMessage('Address must be 5-250 characters'),
    maybe(body('city')).isString().trim().isLength({ min: 2, max: 80 }).withMessage('City/area must be 2-80 characters'),
    coordinate('latitude', -90, 90),
    coordinate('longitude', -180, 180),
    body().custom((_v, { req }) => {
      const hasLat = req.body.latitude !== undefined && req.body.latitude !== '' && req.body.latitude !== null;
      const hasLng = req.body.longitude !== undefined && req.body.longitude !== '' && req.body.longitude !== null;
      if (hasLat !== hasLng) throw new Error('Provide both latitude and longitude, or neither');
      return true;
    }),
  ];
};

export const createComplaintRules = complaintFields(false);

export const updateComplaintRules = [
  objectIdParam('id'),
  ...complaintFields(true),
  body('removeAttachment').optional().isIn(['true', 'false', true, false]).withMessage('removeAttachment must be true or false'),
];

export const listComplaintRules = [
  ...listQuery,
  query('status').optional({ values: 'falsy' }).isIn(STATUSES).withMessage('Invalid status filter'),
  query('category').optional({ values: 'falsy' }).isIn(CATEGORIES).withMessage('Invalid category filter'),
  query('priority').optional({ values: 'falsy' }).isIn(PRIORITIES).withMessage('Invalid priority filter'),
  query('department').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid department filter'),
];

export const referenceRules = [
  param('referenceNumber')
    .isString()
    .trim()
    .toUpperCase()
    .matches(/^CF-\d{4}-\d{6}$/)
    .withMessage('Reference numbers look like CF-2026-000123'),
];

export const addUpdateRules = [
  objectIdParam('id'),
  body('publicMessage').optional().isString().trim().isLength({ max: 1000 }).withMessage('Message must be at most 1000 characters'),
  body('internalNote').optional().isString().trim().isLength({ max: 1000 }).withMessage('Note must be at most 1000 characters'),
  body().custom((_v, { req }) => {
    const pub = (req.body.publicMessage || '').trim();
    const internal = (req.body.internalNote || '').trim();
    if (!pub && !internal) throw new Error('Enter a message or an internal note');
    return true;
  }),
];
