import Booking from '../models/Booking.js';

export class BookingService {
  /**
   * Checks whether a provider is free for a proposed schedule slot with a 45-minute buffer
   */
  static async checkProviderAvailability(providerId, startTime, endTime, excludeBookingId = null) {
    const bufferMs = 45 * 60 * 1000; // 45 minute buffer
    const bufferedStart = new Date(new Date(startTime).getTime() - bufferMs);
    const bufferedEnd = new Date(new Date(endTime).getTime() + bufferMs);

    const query = {
      providerId,
      status: { $in: ['CONFIRMED', 'PROVIDER_EN_ROUTE', 'IN_PROGRESS'] },
      $or: [
        { scheduledStart: { $lt: bufferedEnd, $gt: bufferedStart } },
        { scheduledEnd: { $lt: bufferedEnd, $gt: bufferedStart } },
        {
          scheduledStart: { $lte: bufferedStart },
          scheduledEnd: { $gte: bufferedEnd }
        }
      ]
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne(query);

    return {
      available: !conflictingBooking,
      conflictingBooking
    };
  }
}
