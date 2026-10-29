import { ComplaintActivity } from '../models/ComplaintActivity.js';

export function recordActivity({
  complaint,
  actor,
  action,
  previousStatus = null,
  newStatus = null,
  publicMessage = '',
  internalNote = '',
  visibleToCitizen,
}) {
  const visible = visibleToCitizen ?? !(internalNote && !publicMessage && !newStatus);
  return ComplaintActivity.create({
    complaintId: complaint._id,
    actorId: actor._id,
    actorRole: actor.role,
    action,
    previousStatus,
    newStatus,
    publicMessage,
    internalNote,
    visibleToCitizen: visible,
  });
}

/**
 * Loads a complaint's timeline. Citizens never receive internal notes or
 * admin-only records: the fields are excluded in the database query itself.
 */
export function getTimeline(complaintId, { includeInternal }) {
  const filter = { complaintId };
  if (!includeInternal) filter.visibleToCitizen = true;
  const query = ComplaintActivity.find(filter).sort({ createdAt: 1 }).populate('actorId', 'name role');
  if (!includeInternal) query.select('-internalNote');
  return query.lean();
}

/** Converts timeline docs into API shape. Citizens see "CivicFix staff" instead of admin names. */
export function presentTimeline(items, { includeInternal }) {
  return items.map((a) => {
    const actor = a.actorId;
    const isAdminActor = a.actorRole === 'admin';
    const out = {
      _id: a._id,
      action: a.action,
      previousStatus: a.previousStatus,
      newStatus: a.newStatus,
      publicMessage: a.publicMessage,
      createdAt: a.createdAt,
      actor: {
        role: a.actorRole,
        name: isAdminActor && !includeInternal ? 'CivicFix staff' : actor?.name || 'Deleted user',
      },
    };
    if (includeInternal) {
      out.internalNote = a.internalNote;
      out.visibleToCitizen = a.visibleToCitizen;
    }
    return out;
  });
}
