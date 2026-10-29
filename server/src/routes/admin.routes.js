import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { objectIdParam } from '../validators/common.js';
import { listComplaintRules } from '../validators/complaint.validators.js';
import {
  assignRules,
  departmentCreateRules,
  departmentUpdateRules,
  statusChangeRules,
  userListRules,
  userStatusRules,
} from '../validators/admin.validators.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.ADMIN));

router.get('/dashboard', admin.dashboard);

router.get('/complaints', listComplaintRules, validate, admin.listAllComplaints);
router.patch('/complaints/:id/status', statusChangeRules, validate, admin.changeStatus);
router.patch('/complaints/:id/assign', assignRules, validate, admin.assignComplaint);

router.get('/users', userListRules, validate, admin.listUsers);
router.get('/users/:id', objectIdParam('id'), validate, admin.getUser);
router.patch('/users/:id/status', userStatusRules, validate, admin.setUserStatus);

router.get('/departments', admin.listDepartments);
router.post('/departments', departmentCreateRules, validate, admin.createDepartment);
router.patch('/departments/:id', departmentUpdateRules, validate, admin.updateDepartment);
router.delete('/departments/:id', objectIdParam('id'), validate, admin.deactivateDepartment);

export default router;
