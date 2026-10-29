import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { transform(_d, ret) { delete ret.__v; return ret; } },
  },
);

// Case-insensitive uniqueness: "Sanitation" and "sanitation" are the same department.
departmentSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const Department = mongoose.model('Department', departmentSchema);
