import ReassignmentHistory from '../models/ReassignmentHistory.js';
import Booking from '../models/Booking.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { MatchingService } from '../services/matchingService.js';
import { NotificationService } from '../services/notificationService.js';

export const reassignProvider = async (req, res, next) => {
  try {
    const { reason = 'Provider became unavailable' } = req.body;
    const booking = await Booking.findById(req.params.id).populate('requestId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const request = await ServiceRequest.findById(booking.requestId._id || booking.requestId);
    const ranked = await MatchingService.findAndRankEligibleProviders(request);
    const nextProvider = ranked[0]?.providerId || null;
    if (!nextProvider) return res.status(400).json({ success: false, message: 'No eligible providers available for reassignment' });

    const previousProvider = booking.providerId;
    booking.providerId = nextProvider;
    booking.status = 'CONFIRMED';
    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({ status: 'CONFIRMED', changedBy: req.user._id, note: 'Provider reassigned automatically' });
    await booking.save();

    await ReassignmentHistory.create({
      requestId: booking.requestId,
      bookingId: booking._id,
      originalProvider: previousProvider,
      previousProvider,
      newProvider: nextProvider,
      reason,
      initiatedBy: req.user._id
    });

    await NotificationService.sendNotification({
      recipientId: nextProvider,
      title: 'New reassignment request',
      message: `A provider reassignment was triggered for ${request?.title || 'service request'}.`,
      type: 'BOOKING_CONFIRMED',
      linkUrl: '/provider/jobs'
    });

    res.json({ success: true, data: { booking, nextProvider, reason } });
  } catch (error) {
    next(error);
  }
};
