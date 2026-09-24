import mongoose from 'mongoose';

const providerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true },
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' }],
    skillTags: [{ type: String }],
    serviceAreas: [{ type: String, trim: true }],
    pricing: { type: mongoose.Schema.Types.Mixed, default: {} },
    documents: [{ type: String }],
    experienceYears: { type: Number, default: 3 },
    hourlyRate: { type: Number, required: true, default: 45 },
    serviceAreaRadiusKm: { type: Number, default: 25 },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [-73.935242, 40.73061] } // [lng, lat]
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    completedJobsCount: { type: Number, default: 15 },
    isAvailableNow: { type: Boolean, default: true },
    bookingLockUntil: { type: Date, default: null },
    bio: { type: String, default: 'Licensed and background-checked home service specialist.' }
  },
  { timestamps: true }
);

providerProfileSchema.index({ location: '2dsphere' });

export default mongoose.model('ProviderProfile', providerProfileSchema);
