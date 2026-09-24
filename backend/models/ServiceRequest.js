import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    urgency: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
      default: 'MEDIUM'
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'URGENT', 'EMERGENCY'],
      default: 'NORMAL'
    },
    emergencyReason: { type: String, default: '' },
    emergencyCreatedAt: { type: Date, default: null },
    responseDeadline: { type: Date, default: null },
    preferredDate: { type: Date, required: true },
    timeSlot: { type: String, default: '09:00 AM - 12:00 PM' },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      coordinates: { type: [Number], default: [-73.935242, 40.73061] } // [lng, lat]
    },
    images: [{ type: String }],
    aiAnalysis: {
      classifiedCategoryName: String,
      identifiedSkills: [String],
      urgencyScore: Number,
      estimatedCostRange: {
        min: Number,
        max: Number
      },
      reasoning: String
    },
    eligibleProviders: [
      {
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        matchScore: Number,
        matchReasoning: String,
        ratingAverage: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 }
      }
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'AI_ANALYZED', 'QUOTING', 'BOOKED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'],
      default: 'AI_ANALYZED'
    }
  },
  { timestamps: true }
);

export default mongoose.model('ServiceRequest', serviceRequestSchema);
