import mongoose from 'mongoose';

const reassignmentHistorySchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    originalProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    previousProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    newProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, default: 'Provider became unavailable' },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('ReassignmentHistory', reassignmentHistorySchema);
