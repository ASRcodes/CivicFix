import { getConfig } from '../config/env.js';
import { User } from '../models/User.js';
import { Complaint } from '../models/Complaint.js';
import { authCookieOptions, clearCookieOptions, signToken } from '../services/tokenService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

function startSession(res, user) {
  const { cookie } = getConfig();
  res.cookie(cookie.name, signToken(user), authCookieOptions());
}

export const register = asyncHandler(async (req, res) => {
  // Only whitelisted fields are read; "role" in the body is ignored on purpose.
  const { name, email, password, phone } = req.body;
  const exists = await User.exists({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({
    name,
    email,
    phone: phone || '',
    passwordHash: await User.hashPassword(password),
    role: ROLES.CITIZEN,
  });
  startSession(res, user);
  return sendSuccess(res, { status: 201, message: 'Account created successfully', data: { user } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message for unknown email and wrong password (prevents account enumeration).
  const valid = user ? await user.comparePassword(password) : false;
  if (!user || !valid) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated. Contact the administrator.');

  user.lastLoginAt = new Date();
  await user.save();
  startSession(res, user);
  return sendSuccess(res, { message: 'Logged in successfully', data: { user: user.toJSON() } });
});

export const logout = asyncHandler(async (_req, res) => {
  const { cookie } = getConfig();
  res.clearCookie(cookie.name, clearCookieOptions());
  return sendSuccess(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  const complaintCount = req.user.role === ROLES.CITIZEN
    ? await Complaint.countDocuments({ citizenId: req.user._id })
    : undefined;
  return sendSuccess(res, { data: { user: req.user, complaintCount } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone || '';
  await req.user.save();
  return sendSuccess(res, { message: 'Profile updated', data: { user: req.user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  const valid = await user.comparePassword(req.body.currentPassword);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');
  user.passwordHash = await User.hashPassword(req.body.newPassword);
  await user.save();
  return sendSuccess(res, { message: 'Password changed' });
});
