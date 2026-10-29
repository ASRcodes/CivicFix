import mongoose from 'mongoose';
import { Complaint } from '../models/Complaint.js';
import { ComplaintActivity } from '../models/ComplaintActivity.js';
import { Department } from '../models/Department.js';
import { User } from '../models/User.js';
import { recordActivity } from '../services/activityService.js';
import { validateTransition } from '../services/statusWorkflow.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ACTIVITY_ACTIONS, CATEGORIES, PRIORITIES, ROLES, STATUSES } from '../utils/constants.js';
import { asString, buildComplaintFilter, buildMeta, buildSort, escapeRegex, getPagination } from '../utils/query.js';

/* ------------------------------------------------------------------ */
/* Dashboard                                                          */
/* ------------------------------------------------------------------ */

export const dashboard = asyncHandler(async (_req, res) => {
  const [facet] = await Complaint.aggregate([
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
        resolution: [
          { $match: { status: 'Resolved', resolvedAt: { $ne: null } } },
          { $group: { _id: null, avgMs: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } } } },
        ],
        lastThirtyDays: [
          { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 864e5) } } },
          { $count: 'count' },
        ],
      },
    },
  ]);

  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  facet.byStatus.forEach((s) => { statusCounts[s._id] = s.count; });
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const closable = total - statusCounts.Rejected;

  const recentActivity = await ComplaintActivity.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('actorId', 'name role')
    .populate('complaintId', 'referenceNumber title')
    .lean();

  const [userCount, departmentCount] = await Promise.all([
    User.countDocuments({ role: ROLES.CITIZEN }),
    Department.countDocuments({ isActive: true }),
  ]);

  return sendSuccess(res, {
    data: {
      totals: {
        total,
        pending: statusCounts.Pending,
        underReview: statusCounts['Under Review'],
        inProgress: statusCounts['In Progress'],
        resolved: statusCounts.Resolved,
        rejected: statusCounts.Rejected,
        lastThirtyDays: facet.lastThirtyDays[0]?.count || 0,
        citizens: userCount,
        activeDepartments: departmentCount,
      },
      // Resolution rate = resolved / (all complaints except rejected ones)
      resolutionRate: closable > 0 ? Math.round((statusCounts.Resolved / closable) * 1000) / 10 : 0,
      averageResolutionDays: facet.resolution[0] ? Math.round((facet.resolution[0].avgMs / 864e5) * 10) / 10 : null,
      byStatus: statusCounts,
      byCategory: CATEGORIES.map((c) => ({ category: c, count: facet.byCategory.find((x) => x._id === c)?.count || 0 })),
      byPriority: PRIORITIES.map((p) => ({ priority: p, count: facet.byPriority.find((x) => x._id === p)?.count || 0 })),
      recentActivity: recentActivity.map((a) => ({
        _id: a._id,
        action: a.action,
        previousStatus: a.previousStatus,
        newStatus: a.newStatus,
        publicMessage: a.publicMessage,
        internalNote: a.internalNote,
        createdAt: a.createdAt,
        actor: { name: a.actorId?.name || 'Deleted user', role: a.actorRole },
        complaint: a.complaintId ? { _id: a.complaintId._id, referenceNumber: a.complaintId.referenceNumber, title: a.complaintId.title } : null,
      })),
    },
  });
});

/* ------------------------------------------------------------------ */
/* Complaint management                                               */
/* ------------------------------------------------------------------ */

export const listAllComplaints = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 15 });
  const filter = buildComplaintFilter(req.query, { statuses: STATUSES, categories: CATEGORIES, priorities: PRIORITIES });

  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .sort(buildSort(req.query.sort))
      .skip(skip)
      .limit(limit)
      .populate('departmentId', 'name')
      .populate('citizenId', 'name email')
      .lean(),
    Complaint.countDocuments(filter),
  ]);
  const complaints = items.map(({ priorityWeight, __v, ...c }) => c);
  return sendSuccess(res, { data: { complaints }, meta: buildMeta({ page, limit, total }) });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const publicMessage = (req.body.publicMessage || '').trim();
  const internalNote = (req.body.internalNote || '').trim();

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw ApiError.notFound('Complaint not found');

  const previousStatus = complaint.status;
  const check = validateTransition(previousStatus, status, { reason: publicMessage });
  if (!check.ok) throw ApiError.unprocessable(check.message, [{ field: 'status', message: check.message }]);

  const update = { status };
  if (status === 'Resolved') update.resolvedAt = new Date();
  if (previousStatus === 'Resolved') update.resolvedAt = null; // reopened

  // Conditional update: fails if another admin changed the status meanwhile.
  const updated = await Complaint.findOneAndUpdate(
    { _id: complaint._id, status: previousStatus },
    { $set: update },
    { new: true, runValidators: true },
  );
  if (!updated) throw ApiError.conflict('The complaint status was changed by someone else. Reload and try again.');

  await recordActivity({
    complaint: updated,
    actor: req.user,
    action: ACTIVITY_ACTIONS.STATUS_CHANGED,
    previousStatus,
    newStatus: status,
    publicMessage: publicMessage || (status === 'Rejected' ? '' : `Status changed to ${status}`),
    internalNote,
    visibleToCitizen: true,
  });

  return sendSuccess(res, { message: `Status changed to ${status}`, data: { complaint: updated } });
});

export const assignComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw ApiError.notFound('Complaint not found');
  if (complaint.status === 'Rejected') throw ApiError.conflict('Rejected complaints cannot be assigned');

  const parts = [];
  if (req.body.departmentId !== undefined) {
    if (!req.body.departmentId) {
      complaint.departmentId = null;
      parts.push('department cleared');
    } else {
      const dept = await Department.findById(req.body.departmentId);
      if (!dept) throw ApiError.notFound('Department not found');
      if (!dept.isActive) throw ApiError.unprocessable('This department is deactivated');
      complaint.departmentId = dept._id;
      parts.push(`assigned to ${dept.name}`);
    }
  }
  if (req.body.assignedTo !== undefined) {
    complaint.assignedTo = req.body.assignedTo;
    parts.push(req.body.assignedTo ? `field staff: ${req.body.assignedTo}` : 'staff assignment cleared');
  }

  if (!complaint.isModified()) {
    return sendSuccess(res, { message: 'Assignment unchanged', data: { complaint } });
  }
  await complaint.save();
  await complaint.populate('departmentId', 'name');

  const summary = parts.join('; ');
  await recordActivity({
    complaint,
    actor: req.user,
    action: ACTIVITY_ACTIONS.ASSIGNED,
    publicMessage: summary.charAt(0).toUpperCase() + summary.slice(1),
    internalNote: (req.body.internalNote || '').trim(),
    visibleToCitizen: true,
  });

  return sendSuccess(res, { message: 'Assignment updated', data: { complaint } });
});

/* ------------------------------------------------------------------ */
/* User management                                                    */
/* ------------------------------------------------------------------ */

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 15 });
  const match = {};
  const role = asString(req.query.role);
  if (role) match.role = role;
  const active = asString(req.query.active);
  if (active) match.isActive = active === 'true';
  const search = asString(req.query.search);
  if (search) {
    const rx = new RegExp(escapeRegex(search.slice(0, 100)), 'i');
    match.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [users, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'complaints',
          let: { uid: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$citizenId', '$$uid'] } } }, { $count: 'n' }],
          as: 'complaintStats',
        },
      },
      {
        $project: {
          name: 1, email: 1, role: 1, phone: 1, isActive: 1, createdAt: 1, lastLoginAt: 1,
          complaintCount: { $ifNull: [{ $arrayElemAt: ['$complaintStats.n', 0] }, 0] },
        },
      },
    ]),
    User.countDocuments(match),
  ]);
  return sendSuccess(res, { data: { users }, meta: buildMeta({ page, limit, total }) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  const statusBreakdown = await Complaint.aggregate([
    { $match: { citizenId: new mongoose.Types.ObjectId(req.params.id) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const recentComplaints = await Complaint.find({ citizenId: user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('referenceNumber title status createdAt')
    .lean();
  const complaintsByStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  statusBreakdown.forEach((s) => { complaintsByStatus[s._id] = s.count; });
  return sendSuccess(res, {
    data: {
      user,
      complaintCount: Object.values(complaintsByStatus).reduce((a, b) => a + b, 0),
      complaintsByStatus,
      recentComplaints,
    },
  });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  if (!isActive) {
    if (String(user._id) === String(req.user._id)) {
      throw ApiError.conflict('You cannot deactivate your own account');
    }
    if (user.role === ROLES.ADMIN && user.isActive) {
      const activeAdmins = await User.countDocuments({ role: ROLES.ADMIN, isActive: true });
      if (activeAdmins <= 1) throw ApiError.conflict('Cannot deactivate the last active administrator');
    }
  }
  user.isActive = isActive;
  await user.save();
  return sendSuccess(res, { message: isActive ? 'Account activated' : 'Account deactivated', data: { user } });
});

/* ------------------------------------------------------------------ */
/* Departments                                                        */
/* ------------------------------------------------------------------ */

export const listDepartments = asyncHandler(async (req, res) => {
  const filter = {};
  if (asString(req.query.active) === 'true') filter.isActive = true;
  const departments = await Department.aggregate([
    { $match: filter },
    { $sort: { isActive: -1, name: 1 } },
    {
      $lookup: {
        from: 'complaints',
        let: { did: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$departmentId', '$$did'] } } },
          { $group: { _id: null, total: { $sum: 1 }, open: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Rejected']] }, 0, 1] } } } },
        ],
        as: 'stats',
      },
    },
    {
      $project: {
        name: 1, description: 1, isActive: 1, createdAt: 1, updatedAt: 1,
        complaintCount: { $ifNull: [{ $arrayElemAt: ['$stats.total', 0] }, 0] },
        openCount: { $ifNull: [{ $arrayElemAt: ['$stats.open', 0] }, 0] },
      },
    },
  ]);
  return sendSuccess(res, { data: { departments } });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create({ name: req.body.name, description: req.body.description || '' });
  return sendSuccess(res, { status: 201, message: 'Department created', data: { department } });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');
  for (const key of ['name', 'description', 'isActive']) {
    if (req.body[key] !== undefined) department[key] = req.body[key];
  }
  await department.save();
  return sendSuccess(res, { message: 'Department updated', data: { department } });
});

/** Soft delete: departments are deactivated so historical complaints keep their reference. */
export const deactivateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');
  department.isActive = false;
  await department.save();
  return sendSuccess(res, { message: 'Department deactivated', data: { department } });
});
