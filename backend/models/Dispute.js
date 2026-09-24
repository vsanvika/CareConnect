import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    evidenceUrls: [{ type: String }],
    status: {
      type: String,
      enum: ['OPEN', 'OPENED', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED'],
      default: 'OPEN'
    },
    resolutionDetails: {
      action: {
        type: String,
        enum: ['FULL_REFUND', 'PARTIAL_REFUND', 'RE_SERVICE', 'DISMISS']
      },
      amount: { type: Number, default: 0 },
      notes: { type: String, default: '' },
      resolvedAt: Date
    },
    history: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Dispute', disputeSchema);
