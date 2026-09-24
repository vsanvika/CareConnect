import Booking from '../models/Booking.js';
import Quote from '../models/Quote.js';
import JobEvidence from '../models/JobEvidence.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { createBookingFromQuote } from '../services/bookingLifecycleService.js';
import { InvoiceService } from '../services/invoiceService.js';
import { NotificationService } from '../services/notificationService.js';
import { storeUploadedFiles, validateUploadedFiles } from '../services/fileStorageService.js';
import { canTransitionBooking } from '../services/bookingStatusService.js';
import { recordAudit } from '../utils/recordAudit.js';

export const getBookings = async (req, res, next) => {
  try {
    let filter = {};
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    if (req.user.role === 'CUSTOMER') {
      filter.customerId = req.user._id;
    } else if (req.user.role === 'SERVICE_PROVIDER') {
      filter.providerId = req.user._id;
    } else if (!['PLATFORM_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'].includes(req.user.role)) {
      filter._id = null;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.user.role === 'PLATFORM_ADMIN' || req.user.role === 'OPERATIONS_MANAGER' || req.user.role === 'SUPPORT_AGENT') {
      if (req.query.provider) filter.providerId = req.query.provider;
      if (req.query.customer) filter.customerId = req.query.customer;
    } else if (req.user.role === 'CUSTOMER') {
      if (req.query.provider) filter.providerId = req.query.provider;
      filter.customerId = req.user._id;
    } else if (req.user.role === 'SERVICE_PROVIDER') {
      if (req.query.customer) filter.customerId = req.query.customer;
      filter.providerId = req.user._id;
    }
    if (req.query.date) {
      const date = new Date(req.query.date);
      filter.scheduledStart = { $gte: new Date(date.setHours(0, 0, 0, 0)), $lt: new Date(date.setHours(23, 59, 59, 999)) };
    }
    if (req.query.from || req.query.to) {
      filter.scheduledStart = {};
      if (req.query.from) filter.scheduledStart.$gte = new Date(req.query.from);
      if (req.query.to) filter.scheduledStart.$lte = new Date(req.query.to);
    }

    const [bookings, total] = await Promise.all([Booking.find(filter)
      .populate('customerId', 'name email phone avatarUrl address')
      .populate('providerId', 'name email phone avatarUrl')
      .populate('requestId')
      .populate('quoteId')
      .sort({ scheduledStart: -1 }).skip((page - 1) * limit).limit(limit), Booking.countDocuments(filter)]);

    res.json({ success: true, count: bookings.length, total, page, limit, pages: Math.ceil(total / limit), data: bookings });
  } catch (err) {
    next(err);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email phone avatarUrl address')
      .populate('providerId', 'name email phone avatarUrl')
      .populate('requestId')
      .populate('quoteId');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const canView = ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'].includes(req.user.role)
      || booking.customerId._id.toString() === req.user._id.toString()
      || booking.providerId._id.toString() === req.user._id.toString();
    if (!canView) return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });

    const evidence = await JobEvidence.find({ bookingId: booking._id });

    res.json({ success: true, data: { ...booking.toObject(), evidence } });
  } catch (err) {
    next(err);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const previousStatus = booking.status;

    const isPlatformAdmin = req.user.role === 'PLATFORM_ADMIN';
    const isCustomerOwner = req.user.role === 'CUSTOMER' && booking.customerId.toString() === req.user._id.toString();
    const isProviderOwner = req.user.role === 'SERVICE_PROVIDER' && booking.providerId.toString() === req.user._id.toString();
    if (!isPlatformAdmin && !isCustomerOwner && !isProviderOwner) {
      return res.status(403).json({ success: false, message: 'Only a booking participant or platform administrator can update this booking' });
    }

    if (!canTransitionBooking(booking.status, status)) {
      return res.status(400).json({ success: false, message: `Invalid booking transition from ${booking.status} to ${status}` });
    }

    if (status === 'CONFIRMED' && !isPlatformAdmin) {
      return res.status(403).json({ success: false, message: 'Only platform operations can confirm a pending booking' });
    }
    if (status === 'DISPUTED' && !isPlatformAdmin) {
      return res.status(403).json({ success: false, message: 'Only support or operations can dispute a booking' });
    }

    const providerStatuses = ['PROVIDER_ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'];
    if (providerStatuses.includes(status) && !isProviderOwner && !isPlatformAdmin) {
      return res.status(403).json({ success: false, message: 'Only the assigned provider can update this job' });
    }
    if (status === 'CUSTOMER_CONFIRMED' && !isCustomerOwner && !isPlatformAdmin) {
      return res.status(403).json({ success: false, message: 'Only the customer can confirm completion' });
    }

    booking.status = status;
    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: req.body.note || ''
    });
    if (req.body.note) booking.jobNotes = req.body.note;

    if (status === 'COMPLETED') {
      booking.completedAt = new Date();

      // Auto-generate invoice
      const quote = await Quote.findById(booking.quoteId);
      const invoice = await InvoiceService.generateInvoiceForBooking(booking, quote || { amount: booking.totalAmount });
      await recordAudit({ req, action: 'INVOICE_CREATED', entityType: 'Invoice', entityId: invoice._id, newState: { paymentStatus: invoice.paymentStatus, totalAmount: invoice.totalAmount }, metadata: { bookingId: booking._id.toString(), generatedOnCompletion: true } });

      // Notify customer
      await NotificationService.sendNotification({
        recipientId: booking.customerId,
        title: 'Job Completed! Invoice Generated',
          message: `Provider completed the job. Invoice ${invoice.invoiceNumber} of ₹${invoice.totalAmount} is ready.`,
        type: 'INVOICE_READY',
        linkUrl: `/customer/bookings/${booking._id}`
      });

      // Update ServiceRequest status
      await ServiceRequest.findByIdAndUpdate(booking.requestId, { status: 'COMPLETED' });
    }
    if (status === 'IN_PROGRESS') {
      await ServiceRequest.findByIdAndUpdate(booking.requestId, { status: 'IN_PROGRESS' });
    }

    await NotificationService.sendNotification({
      recipientId: booking.customerId,
      title: `Booking status: ${status.replaceAll('_', ' ')}`,
      message: `Your service booking status changed to ${status.replaceAll('_', ' ').toLowerCase()}.`,
      type: 'JOB_UPDATE',
      linkUrl: `/customer/bookings/${booking._id}`
    });
    if (status === 'CUSTOMER_CONFIRMED') {
      await NotificationService.sendNotification({
        recipientId: booking.customerId,
        title: 'Share your service review',
        message: 'Your booking is complete. Tell us how your provider did.',
        type: 'REVIEW_REMINDER',
        linkUrl: `/customer/bookings/${booking._id}`
      });
    }

    await booking.save();

    await recordAudit({ req, action: status === 'COMPLETED' ? 'JOB_COMPLETED' : 'BOOKING_STATUS_UPDATED', entityType: 'Booking', entityId: booking._id, previousState: { status: previousStatus }, newState: { status: booking.status }, metadata: { note: req.body.note || '' } });

    res.json({ success: true, message: `Booking status updated to ${status}`, data: booking });
  } catch (err) {
    next(err);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const result = await createBookingFromQuote({ quoteId: req.body.quoteId, actor: req.user });
    const booking = await Booking.findById(result.booking._id)
      .populate('customerId', 'name email phone avatarUrl address')
      .populate('providerId', 'name email phone avatarUrl')
      .populate('requestId')
      .populate('quoteId');
    await recordAudit({ req, action: 'BOOKING_CREATED', entityType: 'Booking', entityId: booking._id, newState: { status: booking.status, providerId: booking.providerId, customerId: booking.customerId }, metadata: { quoteId: booking.quoteId?._id || booking.quoteId } });
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const canCancel = ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER'].includes(req.user.role)
      || booking.customerId.toString() === req.user._id.toString()
      || booking.providerId.toString() === req.user._id.toString();
    if (!canCancel) return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    if (['CANCELLED', 'COMPLETED', 'CUSTOMER_CONFIRMED', 'DISPUTED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking cannot be cancelled in its current state' });
    }

    const previousStatus = booking.status;
    booking.status = 'CANCELLED';
    booking.cancellationReason = req.body.reason || 'Cancelled by booking participant';
    await booking.save();
    await recordAudit({ req, action: 'BOOKING_CANCELLED', entityType: 'Booking', entityId: booking._id, previousState: { status: previousStatus }, newState: { status: booking.status, cancellationReason: booking.cancellationReason } });
    await ServiceRequest.findByIdAndUpdate(booking.requestId, { status: 'CANCELLED' });
    await NotificationService.sendNotification({
      recipientId: booking.providerId,
      title: 'Booking Cancelled',
      message: `Booking for ${booking.requestId} was cancelled.`,
      type: 'BOOKING_CANCELLED',
      linkUrl: '/provider/jobs'
    });
    await NotificationService.sendNotification({
      recipientId: booking.customerId,
      title: 'Booking Cancelled',
      message: `Your booking was cancelled: ${booking.cancellationReason}`,
      type: 'BOOKING_CANCELLED',
      linkUrl: `/customer/bookings/${booking._id}`
    });
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

const getBookingEvidenceAccess = (booking, user) => (
  booking.providerId.toString() === user._id.toString() ||
  booking.customerId.toString() === user._id.toString() ||
  ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'].includes(user.role)
);

const assertAssignedProvider = (booking, user) => {
  if (user.role !== 'SERVICE_PROVIDER' || booking.providerId.toString() !== user._id.toString()) {
    const error = new Error('Only the assigned provider can manage job evidence');
    error.statusCode = 403;
    throw error;
  }
};

const parsePartsUsed = (partsUsed) => {
  if (Array.isArray(partsUsed)) return partsUsed;
  if (!partsUsed) return [];
  try {
    const parsed = JSON.parse(partsUsed);
    return Array.isArray(parsed) ? parsed : [String(partsUsed)];
  } catch {
    return String(partsUsed).split(',').map((part) => part.trim()).filter(Boolean);
  }
};

export const getJobEvidence = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!getBookingEvidenceAccess(booking, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this evidence' });
    }
    const evidence = await JobEvidence.find({ bookingId: booking._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: evidence.length, data: evidence });
  } catch (err) {
    next(err);
  }
};

export const uploadJobEvidence = async (req, res, next) => {
  try {
    const { evidenceType, notes, partsUsed, additionalWork } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    assertAssignedProvider(booking, req.user);

    if (booking.status === 'CANCELLED' || booking.status === 'DISPUTED' || booking.status === 'CUSTOMER_CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Evidence cannot be added to this booking state' });
    }
    if (!['BEFORE_PHOTO', 'AFTER_PHOTO', 'WORK_LOG', 'PARTS_RECEIPT'].includes(evidenceType)) {
      return res.status(400).json({ success: false, message: 'Invalid evidence type' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one evidence file is required' });
    }

    await validateUploadedFiles(req.files);
    const urls = await storeUploadedFiles(req.files);

    const evidence = await JobEvidence.create({
      bookingId: booking._id,
      uploadedBy: req.user._id,
      evidenceType,
      fileUrls: urls,
      notes: notes || '',
      partsUsed: parsePartsUsed(partsUsed),
      additionalWork: additionalWork || ''
    });
    await recordAudit({ req, action: 'JOB_EVIDENCE_UPLOADED', entityType: 'JobEvidence', entityId: evidence._id, newState: { evidenceType: evidence.evidenceType, bookingId: evidence.bookingId }, metadata: { fileCount: evidence.fileUrls.length } });

    res.status(201).json({ success: true, message: 'Evidence uploaded successfully', data: evidence });
  } catch (err) {
    next(err);
  }
};

export const updateJobEvidence = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    const evidence = await JobEvidence.findOne({ _id: req.params.evidenceId, bookingId: req.params.id });
    if (!booking || !evidence) return res.status(404).json({ success: false, message: 'Evidence not found' });
    assertAssignedProvider(booking, req.user);

    if (req.body.notes !== undefined) evidence.notes = req.body.notes;
    if (req.body.partsUsed !== undefined) evidence.partsUsed = parsePartsUsed(req.body.partsUsed);
    if (req.body.additionalWork !== undefined) evidence.additionalWork = req.body.additionalWork;
    await evidence.save();
    await recordAudit({ req, action: 'JOB_EVIDENCE_UPDATED', entityType: 'JobEvidence', entityId: evidence._id, newState: { notes: evidence.notes, partsUsed: evidence.partsUsed, additionalWork: evidence.additionalWork } });
    res.json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
};
