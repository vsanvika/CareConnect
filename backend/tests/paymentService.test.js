import test from 'node:test';
import assert from 'node:assert/strict';
import { PaymentService } from '../services/paymentService.js';

const makeInvoice = () => ({
  paymentStatus: 'PENDING',
  paymentProcessingStatus: 'IDLE',
  paymentFailureReason: '',
  transactionReference: '',
  save: async function save() { return this; }
});

test('simulated payment moves from processing to success', async () => {
  const invoice = await PaymentService.processSimulatedPayment(makeInvoice());
  assert.equal(invoice.paymentProcessingStatus, 'SUCCESS');
  assert.equal(invoice.paymentStatus, 'PAID');
  assert.match(invoice.transactionReference, /^SIM-/);
  assert.ok(invoice.paidAt instanceof Date);
});

test('simulated payment supports deterministic failure', async () => {
  const invoice = await PaymentService.processSimulatedPayment(makeInvoice(), { simulateFailure: true });
  assert.equal(invoice.paymentProcessingStatus, 'FAILED');
  assert.equal(invoice.paymentStatus, 'PENDING');
  assert.equal(invoice.paymentFailureReason, 'Simulated payment failure');
});
