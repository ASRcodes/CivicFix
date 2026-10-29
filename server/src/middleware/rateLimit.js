import rateLimit from 'express-rate-limit';
import { getConfig } from '../config/env.js';

const jsonHandler = (message) => (_req, res) =>
  res.status(429).json({ success: false, message });

export function authLimiter() {
  const { isTest } = getConfig();
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isTest ? 1000 : 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: jsonHandler('Too many attempts. Please wait 15 minutes and try again.'),
  });
}

export function apiLimiter() {
  const { isTest } = getConfig();
  return rateLimit({
    windowMs: 60 * 1000,
    limit: isTest ? 10000 : 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: jsonHandler('Too many requests. Please slow down.'),
  });
}
