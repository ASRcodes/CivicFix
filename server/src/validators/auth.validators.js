import { body } from 'express-validator';

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

export const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').isString().trim().isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }).isLength({ max: 254 }),
  body('password')
    .isString()
    .matches(PASSWORD_RULE)
    .withMessage('Password must be 8-72 characters and include upper-case, lower-case and a number'),
  body('confirmPassword')
    .isString()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  body('phone')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .matches(/^\+?[0-9\s-]{7,20}$/)
    .withMessage('Enter a valid phone number'),
];

export const loginRules = [
  body('email').isString().trim().isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

export const updateProfileRules = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('phone').optional({ values: 'null' }).isString().trim()
    .custom((v) => v === '' || /^\+?[0-9\s-]{7,20}$/.test(v)).withMessage('Enter a valid phone number'),
];

export const changePasswordRules = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword').isString().matches(PASSWORD_RULE)
    .withMessage('Password must be 8-72 characters and include upper-case, lower-case and a number'),
];
