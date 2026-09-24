import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
        enum: [
          'REQUEST_CREATED',
          'AI_CLASSIFICATION_COMPLETED',
          'NEW_MATCHING_REQUEST',
          'QUOTE_RECEIVED',
          'QUOTE_ACCEPTED',
          'BOOKING_CONFIRMED',
          'BOOKING_CANCELLED',
          'JOB_UPDATE',
          'INVOICE_READY',
          'DISPUTE_OPENED',
          'DISPUTE_UPDATE',
          'DISPUTE_ESCALATED',
          'REVIEW_REMINDER',
          'REVIEW_RECEIVED',
          'PROVIDER_VERIFICATION_REQUEST',
          'EMERGENCY_REQUEST',
          'REASSIGNMENT_REQUIRED',
          'MAINTENANCE_REMINDER',
          'AI_DIAGNOSIS_COMPLETED',
          'AI_PRICE_ESTIMATE_READY',
          'SYSTEM'
        ],
      default: 'SYSTEM'
    },
    read: { type: Boolean, default: false },
    linkUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

  notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
