import Booking from '../models/Booking.js';
import Dispute from '../models/Dispute.js';
import ProviderProfile from '../models/ProviderProfile.js';
import User from '../models/User.js';
import { NotificationService } from '../services/notificationService.js';
import { assignProviderToBooking } from '../services/providerAssignmentService.js';
import { recordAudit } from '../utils/recordAudit.js';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS'];
const populateBooking = (query) => query
  .populate('customerId', 'name email phone address')
  .populate('providerId', 'name email phone')
  .populate({ path: 'requestId', populate: { path: 'categoryId' } })
  .populate('quoteId');

export const getOperationsStats = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const now = new Date();
    const [todaysBookings, activeJobs, delayedJobs, pendingAssignments, escalatedCases, completedJobs] = await Promise.all([
      Booking.countDocuments({ scheduledStart: { $gte: startOfDay, $lt: endOfDay } }),
      Booking.countDocuments({ status: { $in: ['CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS'] } }),
      Booking.countDocuments({ status: { $in: ACTIVE_STATUSES }, scheduledEnd: { $lt: now } }),
      Booking.countDocuments({ status: 'PENDING' }),
      Dispute.countDocuments({ status: 'ESCALATED' }),
      Booking.countDocuments({ status: { $in: ['COMPLETED', 'CUSTOMER_CONFIRMED'] } })
    ]);
    res.json({ success: true, data: { todaysBookings, activeJobs, delayedJobs, pendingAssignments, escalatedCases, completedJobs } });
  } catch (err) { next(err); }
};

export const getOperationsBookings = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.delayed === 'true') {
      filter.status = { $in: ACTIVE_STATUSES };
      filter.scheduledEnd = { $lt: new Date() };
    }
    const [bookings, total] = await Promise.all([
      populateBooking(Booking.find(filter).sort({ scheduledStart: 1 }).skip((page - 1) * limit).limit(limit)),
      Booking.countDocuments(filter)
    ]);
    res.json({ success: true, count: bookings.length, total, page, limit, pages: Math.ceil(total / limit), data: bookings });
  } catch (err) { next(err); }
};

export const getOperationsProviders = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'SERVICE_PROVIDER', isActive: true }).select('name email phone address isVerified').sort({ name: 1 });
    const profiles = await ProviderProfile.find({ userId: { $in: users.map((user) => user._id) } });
    const profileMap = new Map(profiles.map((profile) => [profile.userId.toString(), profile]));
    res.json({ success: true, data: users.map((user) => ({ user, profile: profileMap.get(user._id.toString()) || null })) });
  } catch (err) { next(err); }
};

export const assignOperationsProvider = async (req, res, next) => {
  try {
    if (!req.body.providerId) return res.status(400).json({ success: false, message: 'providerId is required' });
    const booking = await populateBooking(Booking.findById(req.params.id));
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (['COMPLETED', 'CUSTOMER_CONFIRMED', 'CANCELLED', 'DISPUTED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Provider cannot be assigned to this booking state' });
    }
    const previousProviderId = booking.providerId;
    await assignProviderToBooking(booking, req.body.providerId, req.user._id);
    await recordAudit({ req, action: 'BOOKING_ASSIGNED', entityType: 'Booking', entityId: booking._id, previousState: { providerId: previousProviderId }, newState: { providerId: req.body.providerId }, metadata: { reassigned: previousProviderId?.toString() !== req.body.providerId } });
    await Promise.all([
      NotificationService.sendNotification({ recipientId: req.body.providerId, title: 'Booking assigned to you', message: `Operations assigned a booking: ${booking.requestId?.title || 'Service job'}.`, type: 'BOOKING_CONFIRMED', linkUrl: '/provider/jobs' }),
      NotificationService.sendNotification({ recipientId: booking.customerId._id || booking.customerId, title: 'Provider assigned', message: `A provider has been assigned to your booking.`, type: 'BOOKING_CONFIRMED', linkUrl: `/customer/bookings/${booking._id}` })
    ]);
    res.json({ success: true, data: await populateBooking(Booking.findById(booking._id)) });
  } catch (err) { next(err); }
};

export const getOperationsEscalations = async (req, res, next) => {
  try {
    const escalations = await Dispute.find({ status: 'ESCALATED' })
      .populate('openedBy', 'name email')
      .populate('assignedAgentId', 'name email')
      .populate({ path: 'bookingId', populate: [{ path: 'customerId', select: 'name email' }, { path: 'providerId', select: 'name email' }, { path: 'requestId', select: 'title' }, { path: 'quoteId', select: 'amount' }] })
      .sort({ updatedAt: -1 });
    res.json({ success: true, count: escalations.length, data: escalations });
  } catch (err) { next(err); }
};
