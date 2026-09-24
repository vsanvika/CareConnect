import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    invoiceNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lineItems: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true }
      }
    ],
    labor: { type: Number, required: true, min: 0, default: 0 },
    parts: { type: Number, required: true, min: 0, default: 0 },
    additionalServices: { type: Number, required: true, min: 0, default: 0 },
    serviceFee: { type: Number, required: true, min: 0, default: 0 },
    subtotal: { type: Number, required: true },
    platformFee: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true },
    discount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING'
    },
    paymentProcessingStatus: {
      type: String,
      enum: ['IDLE', 'PROCESSING', 'SUCCESS', 'FAILED'],
      default: 'IDLE'
    },
    paymentFailureReason: { type: String, default: '' },
    transactionReference: { type: String, default: '' },
    refundAmount: { type: Number, default: 0, min: 0 },
    refundReference: { type: String, default: '' },
    refundedAt: { type: Date },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Invoice', invoiceSchema);
