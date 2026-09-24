import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Wrench' },
    basePrice: { type: Number, required: true, default: 50 },
    requiredSkillTags: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('ServiceCategory', serviceCategorySchema);
