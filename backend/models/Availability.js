import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    kind: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE'],
      default: 'AVAILABLE'
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

// Ensure end is after start
availabilitySchema.pre('save', function (next) {
  if (this.end <= this.start) {
    return next(new Error('Availability end time must be after start time'));
  }
  next();
});

availabilitySchema.index({ providerId: 1, kind: 1, start: 1, end: 1 });

export default mongoose.model('Availability', availabilitySchema);
