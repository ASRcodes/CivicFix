import { getConfig } from '../config/env.js';
import { Complaint } from '../models/Complaint.js';
import { ComplaintActivity } from '../models/ComplaintActivity.js';
import { nextComplaintReference } from '../services/referenceService.js';
import { getTimeline, presentTimeline, recordActivity } from '../services/activityService.js';
import { removeUpload, resolveUploadPath } from '../services/fileService.js';
import { allowedNextStatuses } from '../services/statusWorkflow.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ACTIVITY_ACTIONS, CATEGORIES, PRIORITIES, ROLES, STATUSES } from '../utils/constants.js';
import { buildComplaintFilter, buildMeta, buildSort, getPagination, pick } from '../utils/query.js';

const EDITABLE_FIELDS = ['title', 'description', 'category', 'priority', 'address', 'city', 'latitude', 'longitude'];

const isAdmin = (user) => user?.role === ROLES.ADMIN;

function attachmentFromFile(file) {
  if (!file) return null;
  return {
    filename: file.filename,
    originalName: String(file.originalname || '').slice(0, 200),
    mimeType: file.mimetype,
    size: file.size,
  };
}

function normaliseCoordinates(data) {
  for (const key of ['latitude', 'longitude']) {
    if (key in data && (data[key] === '' || data[key] === null || Number.isNaN(data[key]))) data[key] = null;
  }
  return data;
}

/** Loads a complaint and enforces ownership (citizens) or admin access. */
export async function loadAccessibleComplaint(id, user) {
  const complaint = await Complaint.findById(id);
  if (!complaint) throw ApiError.notFound('Complaint not found');
  if (!isAdmin(user) && String(complaint.citizenId) !== String(user._id)) {
    throw ApiError.forbidden('You can only access your own complaints');
  }
  return complaint;
}

function canCitizenModify(complaint) {
  return getConfig().citizenEditableStatuses.includes(complaint.status);
}

export const createComplaint = asyncHandler(async (req, res) => {
  const data = normaliseCoordinates(pick(req.body, EDITABLE_FIELDS));
  const referenceNumber = await nextComplaintReference();

  const complaint = await Complaint.create({
    ...data,
    referenceNumber,
    citizenId: req.user._id,
    status: 'Pending',
    attachment: attachmentFromFile(req.file),
  });

  await recordActivity({
    complaint,
    actor: req.user,
    action: ACTIVITY_ACTIONS.CREATED,
    newStatus: 'Pending',
    publicMessage: 'Complaint submitted',
  });

  return sendSuccess(res, {
    status: 201,
    message: `Complaint submitted. Your reference number is ${referenceNumber}`,
    data: { complaint },
  });
});

export const listComplaints = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildComplaintFilter(req.query, { statuses: STATUSES, categories: CATEGORIES, priorities: PRIORITIES });
  if (!isAdmin(req.user)) filter.citizenId = req.user._id; // citizens only ever see their own

  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .sort(buildSort(req.query.sort))
      .skip(skip)
      .limit(limit)
      .populate('departmentId', 'name')
      .lean({ virtuals: false }),
    Complaint.countDocuments(filter),
  ]);

  const complaints = items.map(({ priorityWeight, __v, ...c }) => c);
  return sendSuccess(res, { data: { complaints }, meta: buildMeta({ page, limit, total }) });
});

/** Citizen overview: counts by status for the current user plus the latest complaints. */
export const mySummary = asyncHandler(async (req, res) => {
  const filter = isAdmin(req.user) ? {} : { citizenId: req.user._id };
  const [grouped, recent] = await Promise.all([
    Complaint.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.find(filter).sort({ updatedAt: -1 }).limit(5)
      .select('referenceNumber title category status priority createdAt updatedAt').lean(),
  ]);
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  grouped.forEach((g) => { byStatus[g._id] = g.count; });
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  return sendSuccess(res, { data: { total, byStatus, recent } });
});

export const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await loadAccessibleComplaint(req.params.id, req.user);
  await complaint.populate([
    { path: 'departmentId', select: 'name isActive' },
    { path: 'citizenId', select: isAdmin(req.user) ? 'name email phone' : 'name' },
  ]);
  const includeInternal = isAdmin(req.user);
  const timeline = presentTimeline(await getTimeline(complaint._id, { includeInternal }), { includeInternal });

  return sendSuccess(res, {
    data: {
      complaint,
      timeline,
      permissions: {
        canEdit: !isAdmin(req.user) && canCitizenModify(complaint),
        canDelete: isAdmin(req.user) || canCitizenModify(complaint),
        nextStatuses: isAdmin(req.user) ? allowedNextStatuses(complaint.status) : [],
      },
    },
  });
});

export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await loadAccessibleComplaint(req.params.id, req.user);
  if (isAdmin(req.user)) {
    throw ApiError.forbidden('Administrators update complaints through the status and assignment endpoints');
  }
  if (!canCitizenModify(complaint)) {
    throw ApiError.conflict(`Complaints can only be edited while ${getConfig().citizenEditableStatuses.join(' or ')}`);
  }

  const updates = normaliseCoordinates(pick(req.body, EDITABLE_FIELDS));
  const oldAttachment = complaint.attachment?.filename;
  const removeAttachment = String(req.body.removeAttachment) === 'true';

  Object.assign(complaint, updates);
  if (req.file) complaint.attachment = attachmentFromFile(req.file);
  else if (removeAttachment) complaint.attachment = null;

  if (!complaint.isModified()) {
    return sendSuccess(res, { message: 'No changes to save', data: { complaint } });
  }
  await complaint.save();
  if (oldAttachment && (req.file || removeAttachment)) await removeUpload(oldAttachment);

  await recordActivity({
    complaint,
    actor: req.user,
    action: ACTIVITY_ACTIONS.EDITED,
    publicMessage: 'Complaint details were edited by the citizen',
  });
  return sendSuccess(res, { message: 'Complaint updated', data: { complaint } });
});

export const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await loadAccessibleComplaint(req.params.id, req.user);
  if (!isAdmin(req.user) && !canCitizenModify(complaint)) {
    throw ApiError.conflict(`Complaints can only be deleted while ${getConfig().citizenEditableStatuses.join(' or ')}`);
  }
  await ComplaintActivity.deleteMany({ complaintId: complaint._id });
  await complaint.deleteOne();
  if (complaint.attachment?.filename) await removeUpload(complaint.attachment.filename);
  return sendSuccess(res, { message: `Complaint ${complaint.referenceNumber} deleted` });
});

/** Public tracking by reference number. Returns only non-personal information. */
export const getByReference = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({ referenceNumber: req.params.referenceNumber })
    .populate('departmentId', 'name')
    .lean();
  if (!complaint) throw ApiError.notFound('No complaint found with that reference number');

  const activity = await ComplaintActivity.find({
    complaintId: complaint._id,
    visibleToCitizen: true,
    action: { $in: [ACTIVITY_ACTIONS.CREATED, ACTIVITY_ACTIONS.STATUS_CHANGED, ACTIVITY_ACTIONS.ASSIGNED] },
  })
    .sort({ createdAt: 1 })
    .select('action previousStatus newStatus createdAt')
    .lean();

  return sendSuccess(res, {
    data: {
      complaint: {
        referenceNumber: complaint.referenceNumber,
        title: complaint.title,
        category: complaint.category,
        priority: complaint.priority,
        status: complaint.status,
        city: complaint.city,
        department: complaint.departmentId?.name || null,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
        resolvedAt: complaint.resolvedAt,
      },
      timeline: activity,
    },
  });
});

export const getActivity = asyncHandler(async (req, res) => {
  const complaint = await loadAccessibleComplaint(req.params.id, req.user);
  const includeInternal = isAdmin(req.user);
  const timeline = presentTimeline(await getTimeline(complaint._id, { includeInternal }), { includeInternal });
  return sendSuccess(res, { data: { timeline } });
});

/**
 * Adds a message to the complaint thread.
 * Citizens: public comment on their own complaint only.
 * Admins: citizen-visible update and/or internal note.
 */
export const addUpdate = asyncHandler(async (req, res) => {
  const complaint = await loadAccessibleComplaint(req.params.id, req.user);
  const publicMessage = (req.body.publicMessage || '').trim();
  const internalNote = (req.body.internalNote || '').trim();

  if (!isAdmin(req.user)) {
    if (internalNote) throw ApiError.forbidden('Only administrators can add internal notes');
    if (complaint.status === 'Rejected') throw ApiError.conflict('This complaint is closed');
  }

  let action;
  if (isAdmin(req.user)) action = publicMessage ? ACTIVITY_ACTIONS.PUBLIC_UPDATE : ACTIVITY_ACTIONS.INTERNAL_NOTE;
  else action = ACTIVITY_ACTIONS.CITIZEN_COMMENT;

  const activity = await recordActivity({
    complaint,
    actor: req.user,
    action,
    publicMessage,
    internalNote: isAdmin(req.user) ? internalNote : '',
    visibleToCitizen: Boolean(publicMessage),
  });
  complaint.updatedAt = new Date();
  complaint.markModified('updatedAt');
  await complaint.save();

  return sendSuccess(res, { status: 201, message: 'Update added', data: { activityId: activity._id } });
});

/** Streams the attachment to the owner or an admin. Files are never publicly listed. */
export const getAttachment = asyncHandler(async (req, res) => {
  const complaint = await loadAccessibleComplaint(req.params.id, req.user);
  if (!complaint.attachment?.filename) throw ApiError.notFound('This complaint has no attachment');
  const filePath = resolveUploadPath(complaint.attachment.filename);
  if (!filePath) throw ApiError.notFound('Attachment not found');
  res.setHeader('Content-Type', complaint.attachment.mimeType);
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Allow the separately hosted front end to display the image (access is still cookie-authorized).
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  return res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) res.status(404).json({ success: false, message: 'Attachment file is missing' });
  });
});
