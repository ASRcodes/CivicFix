import mongoose from 'mongoose';

/**
 * Atomic sequence counters (one document per sequence key, e.g. "complaint-2026").
 * findOneAndUpdate with $inc is atomic in MongoDB, so concurrent submissions
 * can never receive the same number.
 */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
);

export const Counter = mongoose.model('Counter', counterSchema);
