import mongoose from 'mongoose';
import { CATEGORIES, PRIORITIES, PRIORITY_WEIGHT, STATUSES } from '../utils/constants.js';

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true }, // random name on disk, never user-controlled
    originalName: { type: String, maxlength: 200 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false },
);

const complaintSchema = new mongoose.Schema(
  {
    referenceNumber: { type: String, required: true, unique: true, immutable: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
    category: { type: String, required: true, enum: CATEGORIES },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    priorityWeight: { type: Number, default: 2 },
    status: { type: String, enum: STATUSES, default: 'Pending' },
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    assignedTo: { type: String, trim: true, maxlength: 100, default: '' }, // staff member / field officer name
    address: { type: String, required: true, trim: true, minlength: 5, maxlength: 250 },
    city: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    attachment: { type: attachmentSchema, default: null },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_d, ret) {
        delete ret.__v;
        delete ret.priorityWeight;
        return ret;
      },
    },
  },
);

complaintSchema.pre('validate', function setPriorityWeight(next) {
  this.priorityWeight = PRIORITY_WEIGHT[this.priority] || 2;
  next();
});

// Indexes for the most common queries (referenceNumber is already unique-indexed).
complaintSchema.index({ citizenId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ departmentId: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ priorityWeight: -1, createdAt: -1 });

export const Complaint = mongoose.model('Complaint', complaintSchema);
