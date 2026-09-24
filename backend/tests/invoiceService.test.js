import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvoiceTotals } from '../services/invoiceService.js';

test('calculates invoice totals from labour, parts, services, fee, discount, and tax', () => {
  const totals = calculateInvoiceTotals({
    breakdown: { labor: 500, materials: 300, calloutFee: 50 },
    additionalCharges: [{ description: 'Extra fitting', amount: 100 }],
    discount: 50
  });

  assert.equal(totals.subtotal, 950);
  assert.equal(totals.discount, 50);
  assert.equal(totals.tax, 45);
  assert.equal(totals.totalAmount, 945);
});

test('never allows a discount to produce a negative taxable total', () => {
  const totals = calculateInvoiceTotals({
    breakdown: { labor: 100, materials: 0, calloutFee: 0 },
    discount: 999
  });

  assert.equal(totals.discount, 100);
  assert.equal(totals.tax, 0);
  assert.equal(totals.totalAmount, 0);
});

test('uses quote fallback breakdown values when component values are missing', () => {
  const totals = calculateInvoiceTotals({ amount: 1000 });
  assert.equal(totals.labor, 700);
  assert.equal(totals.parts, 200);
  assert.equal(totals.serviceFee, 100);
  assert.equal(totals.totalAmount, 1050);
});
