import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    breakdown: {
      labor: { type: Number, default: 0 },
      materials: { type: Number, default: 0 },
      calloutFee: { type: Number, default: 0 }
    },
    estimatedDurationHours: { type: Number, default: 2 },
    proposedDateSlot: { type: String, default: 'Tomorrow at 10:00 AM' },
    includedServices: [{ type: String, trim: true }],
    additionalCharges: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 }
      }
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['SUBMITTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN'],
      default: 'SUBMITTED'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Quote', quoteSchema);
