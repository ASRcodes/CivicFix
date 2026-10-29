import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { changePasswordRules, loginRules, registerRules, updateProfileRules } from '../validators/auth.validators.js';

const router = Router();
const limiter = authLimiter();

router.post('/register', limiter, registerRules, validate, auth.register);
router.post('/login', limiter, loginRules, validate, auth.login);
router.post('/logout', auth.logout);
router.get('/me', authenticate, auth.me);
router.patch('/me', authenticate, updateProfileRules, validate, auth.updateProfile);
router.patch('/me/password', limiter, authenticate, changePasswordRules, validate, auth.changePassword);

export default router;
