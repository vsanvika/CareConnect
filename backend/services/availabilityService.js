import Availability from '../models/Availability.js';
import Booking from '../models/Booking.js';
import ProviderProfile from '../models/ProviderProfile.js';
import User from '../models/User.js';

const ACTIVE_BOOKING_STATUSES = {
  $ne: 'CANCELLED'
};

export const normalizeInterval = (start, end) => {
  const normalizedStart = new Date(start);
  const normalizedEnd = new Date(end);

  if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime())) {
    throw new Error('Start and end must be valid dates');
  }

  if (normalizedEnd <= normalizedStart) {
    throw new Error('End time must be after start time');
  }

  return { start: normalizedStart, end: normalizedEnd };
};

export const intervalsOverlap = (firstStart, firstEnd, secondStart, secondEnd) => (
  new Date(firstStart) < new Date(secondEnd) && new Date(firstEnd) > new Date(secondStart)
);

export const intervalWithin = (start, end, windowStart, windowEnd) => (
  new Date(windowStart) <= new Date(start) && new Date(windowEnd) >= new Date(end)
);

const parseTime = (value) => {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (hours < 1 || hours > 12 || minutes > 59) return null;
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
};

export const getRequestedInterval = (preferredDate, timeSlot, durationHours) => {
  const date = new Date(preferredDate);
  if (typeof preferredDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    date.setUTCHours(0, 0, 0, 0);
  }
  const slotStart = String(timeSlot || '').split(' - ')[0];
  const parsedTime = parseTime(slotStart);
  const duration = Number(durationHours);

  if (Number.isNaN(date.getTime()) || !parsedTime || !Number.isFinite(duration) || duration <= 0) {
    throw new Error('Request date, time slot, and quote duration must be valid');
  }

  date.setUTCHours(parsedTime.hours, parsedTime.minutes, 0, 0);
  return normalizeInterval(date, new Date(date.getTime() + duration * 60 * 60 * 1000));
};

export class AvailabilityService {
  static async withProviderBookingLock(providerId, callback) {
    const now = new Date();
    const lockUntil = new Date(now.getTime() + 10000);
    const provider = await ProviderProfile.findOneAndUpdate(
      {
        userId: providerId,
        $or: [
          { bookingLockUntil: null },
          { bookingLockUntil: { $exists: false } },
          { bookingLockUntil: { $lte: now } }
        ]
      },
      { $set: { bookingLockUntil: lockUntil } },
      { new: true }
    );

    if (!provider) {
      const error = new Error('Provider booking is currently being processed');
      error.statusCode = 409;
      throw error;
    }

    try {
      return await callback();
    } finally {
      await ProviderProfile.updateOne(
        { _id: provider._id },
        { $set: { bookingLockUntil: null } }
      );
    }
  }

  static async findOverlappingAvailability(providerId, start, end, kind, excludeId = null) {
    const query = {
      providerId,
      kind,
      start: { $lt: end },
      end: { $gt: start }
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return Availability.findOne(query);
  }

  static async assertAvailabilityWindowIsFree(providerId, start, end, kind, excludeId = null) {
    const { start: normalizedStart, end: normalizedEnd } = normalizeInterval(start, end);
    const overlap = await this.findOverlappingAvailability(
      providerId,
      normalizedStart,
      normalizedEnd,
      kind,
      excludeId
    );

    if (overlap) {
      const error = new Error('Availability period overlaps an existing period');
      error.statusCode = 409;
      throw error;
    }

    return { start: normalizedStart, end: normalizedEnd };
  }

  static async assertProviderCanBeBooked(providerId, start, end, excludeBookingId = null) {
    const { start: normalizedStart, end: normalizedEnd } = normalizeInterval(start, end);
    const provider = await ProviderProfile.findOne({ userId: providerId });

    if (!provider || provider.verificationStatus !== 'VERIFIED') {
      const error = new Error('Provider is not verified');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(providerId).select('isActive isVerified');
    if (!user || !user.isActive || !user.isVerified || !provider.isAvailableNow) {
      const error = new Error('Provider is currently unavailable');
      error.statusCode = 400;
      throw error;
    }

    const availableWindow = await Availability.findOne({
      providerId,
      $or: [{ kind: 'AVAILABLE' }, { kind: { $exists: false } }],
      start: { $lte: normalizedStart },
      end: { $gte: normalizedEnd }
    });

    if (!availableWindow) {
      const error = new Error('Requested time is outside provider availability');
      error.statusCode = 400;
      throw error;
    }

    const unavailablePeriod = await Availability.findOne({
      providerId,
      kind: 'UNAVAILABLE',
      start: { $lt: normalizedEnd },
      end: { $gt: normalizedStart }
    });

    if (unavailablePeriod) {
      const error = new Error('Requested time falls inside an unavailable period');
      error.statusCode = 400;
      throw error;
    }

    const conflictingBookingQuery = {
      providerId,
      status: ACTIVE_BOOKING_STATUSES,
      scheduledStart: { $lt: normalizedEnd },
      scheduledEnd: { $gt: normalizedStart }
    };

    if (excludeBookingId) {
      conflictingBookingQuery._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne(conflictingBookingQuery);
    if (conflictingBooking) {
      const error = new Error('TIME OVERLAP: provider already has a booking during this period');
      error.statusCode = 409;
      error.conflictingBooking = conflictingBooking;
      throw error;
    }

    return { start: normalizedStart, end: normalizedEnd, provider };
  }
}
