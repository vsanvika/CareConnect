import Booking from '../models/Booking.js';
import Quote from '../models/Quote.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { AvailabilityService, getRequestedInterval } from './availabilityService.js';
import { NotificationService } from './notificationService.js';
import { recordAudit } from '../utils/recordAudit.js';

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const createBookingFromQuote = async ({ quoteId, actor }) => {
  if (!quoteId) throw fail('quoteId is required to create a booking', 400);

  const quote = await Quote.findById(quoteId);
  if (!quote) throw fail('Quote not found', 404);

  const request = await ServiceRequest.findById(quote.requestId);
  if (!request) throw fail('Request not found', 404);

  if (actor.role === 'CUSTOMER' && request.customerId.toString() !== actor._id.toString()) {
    throw fail('Only the request creator can accept this quote', 403);
  }

  if (!['QUOTING', 'AI_ANALYZED'].includes(request.status)) {
    throw fail('This request is no longer accepting quotes', 400);
  }

  if (quote.status !== 'SUBMITTED' || (quote.expiresAt && quote.expiresAt <= new Date())) {
    throw fail('Quote is no longer valid for booking', 400);
  }

  const { start: scheduledStart, end: scheduledEnd } = getRequestedInterval(
    request.preferredDate,
    request.timeSlot,
    quote.estimatedDurationHours
  );

  return AvailabilityService.withProviderBookingLock(quote.providerId, async () => {
    const duplicateBooking = await Booking.findOne({
      requestId: request._id,
      status: { $ne: 'CANCELLED' }
    });
    if (duplicateBooking) throw fail('This request already has an active booking', 409);

    const claimedQuote = await Quote.findOneAndUpdate(
      {
        _id: quote._id,
        status: 'SUBMITTED',
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
      },
      { $set: { status: 'ACCEPTED' } },
      { new: true }
    );
    if (!claimedQuote) throw fail('Quote is no longer valid for booking', 409);

    try {
      await AvailabilityService.assertProviderCanBeBooked(
        claimedQuote.providerId,
        scheduledStart,
        scheduledEnd
      );

      const booking = await Booking.create({
        requestId: request._id,
        quoteId: claimedQuote._id,
        customerId: request.customerId,
        providerId: claimedQuote.providerId,
        scheduledStart,
        scheduledEnd,
        totalAmount: claimedQuote.amount,
        status: 'CONFIRMED',
        statusHistory: [{
          status: 'CONFIRMED',
          changedBy: actor._id,
          note: 'Booking created from accepted quote.'
        }]
      });

      await Quote.updateMany(
        { requestId: request._id, _id: { $ne: claimedQuote._id }, status: 'SUBMITTED' },
        { $set: { status: 'REJECTED' } }
      );

      request.status = 'BOOKED';
      await request.save();

      await recordAudit({ req: { user: actor, ip: actor.ipAddress || '127.0.0.1' }, action: 'BOOKING_CREATED_FROM_QUOTE', entityType: 'Booking', entityId: booking._id, newState: { status: booking.status, providerId: booking.providerId, customerId: booking.customerId }, metadata: { quoteId: claimedQuote._id.toString(), requestId: request._id.toString() } });

      await Promise.all([
        NotificationService.sendNotification({
          recipientId: claimedQuote.providerId,
          title: 'Quote accepted',
          message: `Your quote for "${request.title}" was accepted by the customer.`,
          type: 'QUOTE_ACCEPTED',
          linkUrl: `/provider/jobs`
        }),
        NotificationService.sendNotification({
          recipientId: claimedQuote.providerId,
          title: 'Quote Accepted - Booking Confirmed',
          message: `Your quote for "${request.title}" was accepted.`,
          type: 'BOOKING_CONFIRMED',
          linkUrl: `/provider/jobs`
        }),
        NotificationService.sendNotification({
          recipientId: request.customerId,
          title: 'Booking Confirmed',
          message: `Your booking for "${request.title}" is confirmed.`,
          type: 'BOOKING_CONFIRMED',
          linkUrl: `/customer/bookings/${booking._id}`
        })
      ]);

      return { quote: claimedQuote, booking };
    } catch (error) {
      await Quote.updateOne(
        { _id: claimedQuote._id, status: 'ACCEPTED' },
        { $set: { status: 'SUBMITTED' } }
      );
      throw error;
    }
  });
};
