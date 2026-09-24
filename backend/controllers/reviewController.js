import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { canReviewBooking, normalizeReviewRating } from '../services/reviewRules.js';
import { NotificationService } from '../services/notificationService.js';
import { recordAudit } from '../utils/recordAudit.js';

const getRatingSummary = async (providerId) => {
  const summary = await Review.aggregate([
    { $match: { providerId } },
    { $group: { _id: '$providerId', average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  return {
    average: summary[0] ? Math.round(summary[0].average * 10) / 10 : 0,
    count: summary[0]?.count || 0
  };
};

export const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment = '' } = req.body;
    const normalizedRating = normalizeReviewRating(rating);
    if (!bookingId || normalizedRating === null) {
      return res.status(400).json({ success: false, message: 'Booking and a whole-number rating from 1 to 5 are required' });
    }
    if (String(comment).length > 1000) {
      return res.status(400).json({ success: false, message: 'Review comment must be 1000 characters or fewer' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the booking owner can submit a review' });
    }
    if (!canReviewBooking(booking.status)) {
      return res.status(400).json({ success: false, message: 'Review is available after the customer confirms completion' });
    }

    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) return res.status(409).json({ success: false, message: 'This booking has already been reviewed' });

    const review = await Review.create({
      bookingId,
      customerId: req.user._id,
      providerId: booking.providerId,
      rating: normalizedRating,
      comment: String(comment).trim()
    });
    await recordAudit({ req, action: 'REVIEW_CREATED', entityType: 'Review', entityId: review._id, newState: { rating: review.rating, providerId: review.providerId }, metadata: { bookingId: booking._id.toString() } });

    const summary = await getRatingSummary(booking.providerId);
    await ProviderProfile.findOneAndUpdate(
      { userId: booking.providerId },
      { $set: { ratingAverage: summary.average, ratingCount: summary.count } }
    );
    await NotificationService.sendNotification({
      recipientId: booking.providerId,
      title: 'New review received',
      message: `A customer rated your service ${normalizedRating}/5.`,
      type: 'REVIEW_RECEIVED',
      linkUrl: '/provider/dashboard'
    });

    res.status(201).json({ success: true, message: 'Review submitted successfully', data: review, rating: summary });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'This booking has already been reviewed' });
    next(err);
  }
};

export const getProviderReviews = async (req, res, next) => {
  try {
    const providerId = req.params.providerId || req.params.id;
    if (req.user?.role === 'SERVICE_PROVIDER' && providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view another provider reviews' });
    }
    const [reviews, summary] = await Promise.all([
      Review.find({ providerId })
        .populate('customerId', 'name avatarUrl')
        .sort({ createdAt: -1 }),
      getRatingSummary(providerId)
    ]);

    res.json({ success: true, count: reviews.length, averageRating: summary.average, totalReviews: summary.count, data: reviews });
  } catch (err) {
    next(err);
  }
};

export const getCustomerReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ customerId: req.user._id })
      .populate('providerId', 'name email phone avatarUrl')
      .populate('bookingId', 'status scheduledStart totalAmount')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    next(err);
  }
};

export const getReviewForBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.customerId.toString() !== req.user._id.toString() && booking.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this review' });
    }
    const review = await Review.findOne({ bookingId: booking._id }).populate('customerId', 'name avatarUrl');
    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};
