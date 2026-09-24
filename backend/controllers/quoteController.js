import Quote from '../models/Quote.js';
import ServiceRequest from '../models/ServiceRequest.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { NotificationService } from '../services/notificationService.js';
import { createBookingFromQuote } from '../services/bookingLifecycleService.js';
import { recordAudit } from '../utils/recordAudit.js';

export const submitQuote = async (req, res, next) => {
  try {
    const {
      requestId,
      amount,
      breakdown,
      estimatedDurationHours,
      proposedDateSlot,
      includedServices,
      additionalCharges,
      notes
    } = req.body;

    const request = await ServiceRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Service request not found' });
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > 1000000) return res.status(400).json({ success: false, message: 'Quote amount must be greater than zero and within the supported range' });

    if (request.status !== 'QUOTING' && request.status !== 'AI_ANALYZED') {
      return res.status(400).json({ success: false, message: 'This request is no longer accepting quotes' });
    }

    if (
      req.user.role !== 'PLATFORM_ADMIN' &&
      !request.eligibleProviders.some((match) => match.providerId.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Provider is not eligible for this request' });
    }

    // Check if provider already quoted
    const existingQuote = await Quote.findOne({ requestId, providerId: req.user._id });
    if (existingQuote && existingQuote.status !== 'SUBMITTED') {
      return res.status(400).json({ success: false, message: 'Only submitted quotes can be edited' });
    }

    if (existingQuote) {
      existingQuote.amount = amount;
      existingQuote.breakdown = breakdown || existingQuote.breakdown;
      existingQuote.estimatedDurationHours = estimatedDurationHours || existingQuote.estimatedDurationHours;
      existingQuote.proposedDateSlot = proposedDateSlot || existingQuote.proposedDateSlot;
      existingQuote.includedServices = includedServices || existingQuote.includedServices;
      existingQuote.additionalCharges = additionalCharges || existingQuote.additionalCharges;
      existingQuote.notes = notes || existingQuote.notes;
      await existingQuote.save();
      await recordAudit({ req, action: 'QUOTE_UPDATED', entityType: 'Quote', entityId: existingQuote._id, previousState: { status: existingQuote.status }, newState: { amount: existingQuote.amount, status: existingQuote.status } });
      return res.json({ success: true, message: 'Quote updated successfully', data: existingQuote });
    }

    const quote = await Quote.create({
      requestId,
      providerId: req.user._id,
      amount,
      breakdown: breakdown || { labor: amount * 0.7, materials: amount * 0.2, calloutFee: amount * 0.1 },
      estimatedDurationHours: estimatedDurationHours || 2,
      proposedDateSlot: proposedDateSlot || 'Tomorrow at 10:00 AM',
      includedServices: includedServices || [],
      additionalCharges: additionalCharges || [],
      notes: notes || '',
      status: 'SUBMITTED'
    });

    // Notify customer
    await NotificationService.sendNotification({
      recipientId: request.customerId,
        title: 'New Provider Quote Received!',
        message: `You received a quote of ₹${amount} for your request "${request.title}".`,
      type: 'QUOTE_RECEIVED',
      linkUrl: `/customer/request/${request._id}`
    });

    await recordAudit({ req, action: 'QUOTE_SUBMITTED', entityType: 'Quote', entityId: quote._id, newState: { status: quote.status, amount: quote.amount, requestId: quote.requestId }, metadata: { breakdown: quote.breakdown } });

    res.status(201).json({ success: true, message: 'Quote submitted successfully', data: quote });
  } catch (err) {
    next(err);
  }
};

export const getQuotesForRequest = async (req, res, next) => {
  try {
    const quoteFilter = { requestId: req.params.requestId };
    if (req.user.role === 'SERVICE_PROVIDER') quoteFilter.providerId = req.user._id;
    const quoteDocuments = await Quote.find(quoteFilter)
      .populate('providerId', 'name email phone avatarUrl')
      .sort({ amount: 1 });

    const providerIds = quoteDocuments.map((quote) => quote.providerId?._id).filter(Boolean);
    const profiles = await ProviderProfile.find({ userId: { $in: providerIds } }).select('userId ratingAverage ratingCount');
    const profileByUserId = new Map(profiles.map((profile) => [profile.userId.toString(), profile]));
    const quotes = quoteDocuments.map((quote) => {
      const data = quote.toObject();
      const profile = profileByUserId.get(data.providerId?._id?.toString());
      if (profile && data.providerId) {
        data.providerId.ratingAverage = profile.ratingAverage;
        data.providerId.ratingCount = profile.ratingCount;
      }
      return data;
    });

    const request = await ServiceRequest.findById(req.params.requestId).select('customerId');
    const canView = request && (
      req.user.role === 'PLATFORM_ADMIN' ||
      request.customerId.toString() === req.user._id.toString() ||
      quotes.some((quote) => quote.providerId?._id?.toString() === req.user._id.toString())
    );
    if (!canView) return res.status(403).json({ success: false, message: 'Not authorized to view these quotes' });

    res.json({ success: true, count: quotes.length, data: quotes });
  } catch (err) {
    next(err);
  }
};

export const getMyQuotes = async (req, res, next) => {
  try {
    const quotes = await Quote.find({ providerId: req.user._id })
      .populate('requestId', 'title description status preferredDate timeSlot createdAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: quotes.length, data: quotes });
  } catch (err) {
    next(err);
  }
};

export const acceptQuote = async (req, res, next) => {
  try {
    const result = await createBookingFromQuote({ quoteId: req.params.id, actor: req.user });
    await recordAudit({ req, action: 'QUOTE_ACCEPTED', entityType: 'Quote', entityId: result.quote._id, newState: { status: result.quote.status }, metadata: { bookingId: result.booking._id.toString() } });
    await recordAudit({ req, action: 'BOOKING_CREATED', entityType: 'Booking', entityId: result.booking._id, newState: { status: result.booking.status, providerId: result.booking.providerId, customerId: result.booking.customerId }, metadata: { quoteId: result.quote._id.toString() } });

    res.json({
      success: true,
      message: 'Quote accepted and Booking created successfully',
      data: {
        quote: result.quote,
        booking: result.booking
      }
    });
  } catch (err) {
    next(err);
  }
};

export const withdrawQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({ _id: req.params.id, providerId: req.user._id });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    if (quote.status !== 'SUBMITTED') return res.status(400).json({ success: false, message: 'Only submitted quotes can be withdrawn' });
    quote.status = 'WITHDRAWN';
    await quote.save();
    await recordAudit({ req, action: 'QUOTE_WITHDRAWN', entityType: 'Quote', entityId: quote._id, previousState: { status: 'SUBMITTED' }, newState: { status: quote.status } });
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
};

export const updateQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({ _id: req.params.id, providerId: req.user._id });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    if (quote.status !== 'SUBMITTED') return res.status(400).json({ success: false, message: 'Only submitted quotes can be edited' });

    const request = await ServiceRequest.findById(quote.requestId).select('status');
    if (!request || !['QUOTING', 'AI_ANALYZED'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'This request is no longer accepting quote changes' });
    }

    const allowedFields = ['amount', 'breakdown', 'estimatedDurationHours', 'proposedDateSlot', 'includedServices', 'additionalCharges', 'notes'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) quote[field] = req.body[field];
    });
    await quote.save();
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
};

export const rejectQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    const request = await ServiceRequest.findById(quote.requestId).select('customerId');
    if (req.user.role !== 'PLATFORM_ADMIN' && request.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this quote' });
    }
    if (quote.status !== 'SUBMITTED') return res.status(400).json({ success: false, message: 'Only submitted quotes can be rejected' });
    quote.status = 'REJECTED';
    await quote.save();
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
};
