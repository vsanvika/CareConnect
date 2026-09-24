import crypto from 'crypto';

export const simulateRefund = async (invoice, amount) => {
  const refundAmount = Number(amount);
  if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > invoice.totalAmount) {
    const error = new Error('Refund amount must be greater than zero and no more than the invoice total');
    error.statusCode = 400;
    throw error;
  }

  invoice.refundAmount = Math.round((refundAmount + Number.EPSILON) * 100) / 100;
  invoice.refundReference = `REF-${crypto.randomUUID()}`;
  invoice.refundedAt = new Date();
  invoice.paymentStatus = refundAmount >= invoice.totalAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  await invoice.save();
  return invoice;
};
