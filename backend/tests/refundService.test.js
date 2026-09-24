import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateRefund } from '../services/refundService.js';

const makeInvoice = () => ({
  totalAmount: 900,
  paymentStatus: 'PAID',
  refundAmount: 0,
  refundReference: '',
  save: async function save() { return this; }
});

test('simulates a full refund', async () => {
  const invoice = await simulateRefund(makeInvoice(), 900);
  assert.equal(invoice.paymentStatus, 'REFUNDED');
  assert.equal(invoice.refundAmount, 900);
  assert.match(invoice.refundReference, /^REF-/);
});

test('simulates a partial refund', async () => {
  const invoice = await simulateRefund(makeInvoice(), 250);
  assert.equal(invoice.paymentStatus, 'PARTIALLY_REFUNDED');
  assert.equal(invoice.refundAmount, 250);
});

test('rejects refunds above the invoice total', async () => {
  await assert.rejects(() => simulateRefund(makeInvoice(), 901), /no more than the invoice total/);
});
