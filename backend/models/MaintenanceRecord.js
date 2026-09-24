import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    homeProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'HomeProfile', default: null },
    applianceName: { type: String, default: '' },
    category: { type: String, required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    providerName: { type: String, default: '' },
    issue: { type: String, default: '' },
    servicePerformed: { type: String, default: '' },
    invoiceNumber: { type: String, default: '' },
    cost: { type: Number, default: 0 },
    attachments: [{ type: String }],
    notes: { type: String, default: '' },
    nextRecommendedServiceDate: { type: Date, default: null },
    serviceDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

maintenanceRecordSchema.index({ customerId: 1, serviceDate: -1 });

export default mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
