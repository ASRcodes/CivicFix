import { Router } from 'express';
import authRoutes from './auth.routes.js';
import complaintRoutes from './complaint.routes.js';
import adminRoutes from './admin.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);

export default router;
