import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PROVIDER_ON_THE_WAY',
        'IN_PROGRESS',
        'COMPLETED',
        'CUSTOMER_CONFIRMED',
        'CANCELLED',
        'DISPUTED'
      ],
      default: 'CONFIRMED'
    },
    cancellationReason: { type: String, default: '' },
    jobNotes: { type: String, default: '' },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' }
      }
    ],
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);
