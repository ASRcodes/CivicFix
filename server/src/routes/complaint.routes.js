import { Router } from 'express';
import * as complaints from '../controllers/complaint.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { imageUpload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { objectIdParam } from '../validators/common.js';
import {
  addUpdateRules,
  createComplaintRules,
  listComplaintRules,
  referenceRules,
  updateComplaintRules,
} from '../validators/complaint.validators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// Public: track a complaint by its reference number (limited, non-personal fields)
router.get('/reference/:referenceNumber', referenceRules, validate, complaints.getByReference);

router.use(authenticate);

router.post('/', requireRole(ROLES.CITIZEN), imageUpload, createComplaintRules, validate, complaints.createComplaint);
router.get('/', listComplaintRules, validate, complaints.listComplaints);
router.get('/summary', complaints.mySummary);
router.get('/:id', objectIdParam('id'), validate, complaints.getComplaint);
router.patch('/:id', requireRole(ROLES.CITIZEN), imageUpload, updateComplaintRules, validate, complaints.updateComplaint);
router.delete('/:id', objectIdParam('id'), validate, complaints.deleteComplaint);
router.get('/:id/attachment', objectIdParam('id'), validate, complaints.getAttachment);
router.get('/:id/activity', objectIdParam('id'), validate, complaints.getActivity);
router.post('/:id/updates', addUpdateRules, validate, complaints.addUpdate);

export default router;
