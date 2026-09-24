import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

skillSchema.index({ name: 1, category: 1 }, { unique: true });

export default mongoose.model('Skill', skillSchema);
