import { Router } from 'express';
import * as pub from '../controllers/public.controller.js';

const router = Router();

router.get('/stats', pub.stats);
router.get('/recent-complaints', pub.recentComplaints);
router.get('/meta', pub.meta);

export default router;
