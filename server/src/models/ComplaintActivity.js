import mongoose from 'mongoose';
import { ACTIVITY_ACTIONS, STATUSES } from '../utils/constants.js';

/**
 * Append-only activity log for complaints. Every status change, assignment,
 * public update and internal note is a separate record with actor + timestamp.
 */
const activitySchema = new mongoose.Schema(
  {
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, enum: ['citizen', 'admin'], required: true },
    action: { type: String, enum: Object.values(ACTIVITY_ACTIONS), required: true },
    previousStatus: { type: String, enum: [...STATUSES, null], default: null },
    newStatus: { type: String, enum: [...STATUSES, null], default: null },
    publicMessage: { type: String, trim: true, maxlength: 1000, default: '' },
    internalNote: { type: String, trim: true, maxlength: 1000, default: '' },
    // false for admin-only records (e.g. an internal note with no public message)
    visibleToCitizen: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { transform(_d, ret) { delete ret.__v; return ret; } },
  },
);

activitySchema.index({ complaintId: 1, createdAt: 1 });
activitySchema.index({ createdAt: -1 });

export const ComplaintActivity = mongoose.model('ComplaintActivity', activitySchema);
