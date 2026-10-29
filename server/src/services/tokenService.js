import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env.js';
import { expiresInToMs } from '../utils/time.js';

export function signToken(user) {
  const { jwtSecret, jwtExpiresIn } = getConfig();
  return jwt.sign({ sub: String(user._id), role: user.role }, jwtSecret, {
    expiresIn: jwtExpiresIn,
    algorithm: 'HS256',
  });
}

export function verifyToken(token) {
  const { jwtSecret } = getConfig();
  return jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
}

export function authCookieOptions() {
  const { cookie, jwtExpiresIn } = getConfig();
  return {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    domain: cookie.domain,
    path: '/',
    maxAge: expiresInToMs(jwtExpiresIn),
  };
}

export function clearCookieOptions() {
  const { maxAge, ...rest } = authCookieOptions();
  return rest;
}
