import crypto from 'crypto';

export class PaymentService {
  static async processSimulatedPayment(invoice, { simulateFailure = false } = {}) {
    if (invoice.paymentStatus === 'PAID') {
      return invoice;
    }

    invoice.paymentProcessingStatus = 'PROCESSING';
    invoice.paymentFailureReason = '';
    await invoice.save();

    if (simulateFailure) {
      invoice.paymentProcessingStatus = 'FAILED';
      invoice.paymentFailureReason = 'Simulated payment failure';
      await invoice.save();
      return invoice;
    }

    invoice.paymentProcessingStatus = 'SUCCESS';
    invoice.paymentStatus = 'PAID';
    invoice.paidAt = new Date();
    invoice.transactionReference = `SIM-${crypto.randomUUID()}`;
    await invoice.save();
    return invoice;
  }
}
