import test from 'node:test';
import assert from 'node:assert/strict';
import { canReviewBooking, normalizeReviewRating } from '../services/reviewRules.js';

test('allows reviews only after customer confirmation', () => {
  assert.equal(canReviewBooking('CUSTOMER_CONFIRMED'), true);
  assert.equal(canReviewBooking('COMPLETED'), false);
  assert.equal(canReviewBooking('CANCELLED'), false);
});

test('accepts only whole-number ratings from one through five', () => {
  assert.equal(normalizeReviewRating(1), 1);
  assert.equal(normalizeReviewRating(5), 5);
  assert.equal(normalizeReviewRating(4.5), null);
  assert.equal(normalizeReviewRating(0), null);
  assert.equal(normalizeReviewRating(6), null);
});
