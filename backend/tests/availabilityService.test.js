import test from 'node:test';
import assert from 'node:assert/strict';
import { intervalWithin, intervalsOverlap } from '../services/availabilityService.js';

const oldStart = new Date('2026-09-16T10:00:00.000Z');
const oldEnd = new Date('2026-09-16T12:00:00.000Z');

const assertOverlap = (start, end) => {
  assert.equal(intervalsOverlap(start, end, oldStart, oldEnd), true);
};

test('rejects an exact booking overlap', () => {
  assertOverlap(oldStart, oldEnd);
});

test('rejects a partial booking overlap', () => {
  assertOverlap(new Date('2026-09-16T11:00:00.000Z'), new Date('2026-09-16T13:00:00.000Z'));
});

test('rejects a new booking inside an old booking', () => {
  assertOverlap(new Date('2026-09-16T10:30:00.000Z'), new Date('2026-09-16T11:30:00.000Z'));
});

test('rejects an old booking inside a new booking', () => {
  assertOverlap(new Date('2026-09-16T09:00:00.000Z'), new Date('2026-09-16T13:00:00.000Z'));
});

test('allows adjacent non-overlapping bookings', () => {
  assert.equal(
    intervalsOverlap(new Date('2026-09-16T12:00:00.000Z'), new Date('2026-09-16T13:00:00.000Z'), oldStart, oldEnd),
    false
  );
});

test('rejects a booking outside the provider availability window', () => {
  assert.equal(
    intervalWithin(
      new Date('2026-09-16T11:00:00.000Z'),
      new Date('2026-09-16T13:00:00.000Z'),
      oldStart,
      oldEnd
    ),
    false
  );
});
