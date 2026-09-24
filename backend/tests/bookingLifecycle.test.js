import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionBooking } from '../services/bookingStatusService.js';

test('supports the complete provider job lifecycle', () => {
  const lifecycle = [
    'BOOKED',
    'CONFIRMED',
    'PROVIDER_ON_THE_WAY',
    'IN_PROGRESS',
    'COMPLETED',
    'CUSTOMER_CONFIRMED'
  ];

  // BOOKED is the request-level state before the booking record is confirmed.
  assert.equal(canTransitionBooking('PENDING', 'CONFIRMED'), true);
  for (let index = 1; index < lifecycle.length - 1; index += 1) {
    assert.equal(canTransitionBooking(lifecycle[index], lifecycle[index + 1]), true);
  }
});

test('rejects invalid lifecycle jumps', () => {
  assert.equal(canTransitionBooking('CONFIRMED', 'COMPLETED'), false);
  assert.equal(canTransitionBooking('CANCELLED', 'IN_PROGRESS'), false);
  assert.equal(canTransitionBooking('CUSTOMER_CONFIRMED', 'IN_PROGRESS'), false);
});
