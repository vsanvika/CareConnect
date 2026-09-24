import mongoose from 'mongoose';

const applianceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    brand: { type: String, default: '' },
    model: { type: String, default: '' },
    installationDate: { type: Date },
    warrantyInfo: { type: String, default: '' },
    maintenanceNotes: { type: String, default: '' }
  },
  { _id: true }
);

const homeProfileSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    homeType: { type: String, default: 'Apartment' },
    approximateSize: { type: String, default: '' },
    numberOfRooms: { type: Number, default: 0 },
    location: { type: String, default: '' },
    appliances: [applianceSchema],
    maintenanceNotes: { type: String, default: '' },
    lastUpdatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('HomeProfile', homeProfileSchema);
