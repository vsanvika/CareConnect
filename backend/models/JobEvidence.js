import mongoose from 'mongoose';

const jobEvidenceSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    evidenceType: {
      type: String,
      enum: ['BEFORE_PHOTO', 'AFTER_PHOTO', 'WORK_LOG', 'PARTS_RECEIPT'],
      required: true
    },
    fileUrls: [{ type: String, required: true }],
    notes: { type: String, default: '' },
    partsUsed: [{ type: String, trim: true }],
    additionalWork: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('JobEvidence', jobEvidenceSchema);
