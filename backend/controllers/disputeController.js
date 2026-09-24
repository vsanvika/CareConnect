import Dispute from '../models/Dispute.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import JobEvidence from '../models/JobEvidence.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { NotificationService } from '../services/notificationService.js';
import { simulateRefund } from '../services/refundService.js';
import { recordAudit } from '../utils/recordAudit.js';

const VALID_REASONS = new Set([
  'Provider did not arrive',
  'Poor service',
  'Incorrect charge',
  'Service incomplete',
  'Damage caused',
  'Other'
]);

const SUPPORT_ROLES = ['SUPPORT_AGENT', 'OPERATIONS_MANAGER', 'PLATFORM_ADMIN'];
const ESCALATION_ROLES = ['OPERATIONS_MANAGER', 'PLATFORM_ADMIN'];

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const audit = (req, action, dispute, details = {}) => recordAudit({ req, action, entityType: 'Dispute', entityId: dispute._id, newState: { status: dispute.status }, metadata: details });

const notifyParties = (dispute, title, message) => Promise.all([
  NotificationService.sendNotification({
    recipientId: dispute.openedBy,
    title,
    message,
    type: 'DISPUTE_UPDATE',
    linkUrl: '/customer/dashboard'
  })
]);

const canAccessDispute = (dispute, user) => {
  if (SUPPORT_ROLES.includes(user.role)) return true;
  return dispute.openedBy.toString() === user._id.toString();
};

const canActOnDispute = (dispute, user) => {
  if (!SUPPORT_ROLES.includes(user.role)) return false;
  if (dispute.status === 'ESCALATED') return ESCALATION_ROLES.includes(user.role);
  if (user.role !== 'SUPPORT_AGENT') return true;
  return !dispute.assignedAgentId || dispute.assignedAgentId.toString() === user._id.toString();
};

const populateDispute = async (dispute) => {
  const populated = await Dispute.findById(dispute._id)
    .populate('openedBy', 'name email phone avatarUrl role')
    .populate('assignedAgentId', 'name email phone avatarUrl role')
    .populate({
      path: 'bookingId',
      populate: [
        { path: 'customerId', select: 'name email phone avatarUrl address' },
        { path: 'providerId', select: 'name email phone avatarUrl' },
        { path: 'requestId' },
        { path: 'quoteId' }
      ]
    });
  const evidence = await JobEvidence.find({ bookingId: dispute.bookingId }).sort({ createdAt: -1 });
  const invoice = await Invoice.findOne({ bookingId: dispute.bookingId });
  return { ...populated.toObject(), evidence, invoice };
};

export const createDispute = async (req, res, next) => {
  try {
    const { bookingId, reason, description, evidenceUrls = [] } = req.body;
    if (!VALID_REASONS.has(reason) || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'A valid reason and description are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (req.user.role !== 'CUSTOMER' || booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the booking customer can open a dispute' });
    }
    if (['CANCELLED', 'DISPUTED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'This booking cannot open another dispute' });
    }
    const existing = await Dispute.findOne({ bookingId, status: { $in: ['OPEN', 'OPENED', 'UNDER_REVIEW', 'ESCALATED'] } });
    if (existing) return res.status(409).json({ success: false, message: 'This booking already has an active dispute' });

    const dispute = await Dispute.create({
      bookingId,
      openedBy: req.user._id,
      reason,
      description: description.trim(),
      evidenceUrls,
      status: 'OPEN',
      history: [{ senderId: req.user._id, message: `Dispute opened: ${description.trim()}` }]
    });

    booking.status = 'DISPUTED';
    await booking.save();
    await ServiceRequest.findByIdAndUpdate(booking.requestId, { status: 'DISPUTED' });
    await audit(req, 'DISPUTE_CREATED', dispute, { reason });
    await Promise.all([
      NotificationService.sendNotification({
        recipientId: booking.providerId,
        title: 'Dispute raised for your booking',
        message: `A customer opened a dispute: ${reason}.`,
        type: 'DISPUTE_OPENED',
        linkUrl: '/provider/jobs'
      }),
      NotificationService.notifyRoles({
        roles: ['SUPPORT_AGENT', 'OPERATIONS_MANAGER', 'PLATFORM_ADMIN'],
        title: 'New dispute requires review',
        message: `A new ${reason} dispute was opened.`,
        type: 'DISPUTE_OPENED',
        linkUrl: '/support/dashboard'
      })
    ]);

    res.status(201).json({ success: true, message: 'Dispute opened and submitted to support', data: dispute });
  } catch (err) {
    next(err);
  }
};

export const getDisputes = async (req, res, next) => {
  try {
    const filter = {};
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    if (req.query.status) filter.status = req.query.status;
    if (req.query.reason) filter.reason = req.query.reason;
    if (req.query.date) {
      const date = new Date(req.query.date);
      filter.createdAt = { $gte: new Date(date.setHours(0, 0, 0, 0)), $lt: new Date(date.setHours(23, 59, 59, 999)) };
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }
    if (req.user.role === 'CUSTOMER') {
      filter.openedBy = req.user._id;
    } else if (req.user.role === 'SERVICE_PROVIDER') {
      const bookings = await Booking.find({ providerId: req.user._id }).select('_id');
      filter.bookingId = { $in: bookings.map((booking) => booking._id) };
    } else if (req.user.role === 'SUPPORT_AGENT') {
      filter.$or = [{ assignedAgentId: req.user._id }, { assignedAgentId: null }];
    } else if (!['OPERATIONS_MANAGER', 'PLATFORM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view disputes' });
    }

    const [disputes, total] = await Promise.all([Dispute.find(filter)
      .populate('openedBy', 'name email phone avatarUrl role')
      .populate('assignedAgentId', 'name email phone avatarUrl')
      .populate({ path: 'bookingId', populate: [{ path: 'customerId' }, { path: 'providerId' }, { path: 'requestId' }, { path: 'quoteId' }] })
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Dispute.countDocuments(filter)]);

    res.json({ success: true, count: disputes.length, total, page, limit, pages: Math.ceil(total / limit), data: disputes });
  } catch (err) {
    next(err);
  }
};

export const getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    if (!canAccessDispute(dispute, req.user)) return res.status(403).json({ success: false, message: 'Not authorized to view this dispute' });
    res.json({ success: true, data: await populateDispute(dispute) });
  } catch (err) {
    next(err);
  }
};

export const assignDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    if (!canActOnDispute(dispute, req.user)) return res.status(403).json({ success: false, message: 'You cannot claim this dispute' });
    if (!['OPEN', 'OPENED', 'UNDER_REVIEW', 'ESCALATED'].includes(dispute.status)) return res.status(400).json({ success: false, message: 'Dispute is already closed' });

    dispute.assignedAgentId = req.user._id;
    dispute.status = dispute.status === 'ESCALATED' ? 'UNDER_REVIEW' : 'UNDER_REVIEW';
    dispute.history.push({ senderId: req.user._id, message: `${req.user.name || 'Support agent'} started reviewing this dispute.` });
    await dispute.save();
    await audit(req, 'DISPUTE_ASSIGNED', dispute);
    res.json({ success: true, data: dispute });
  } catch (err) {
    next(err);
  }
};

export const addDisputeNote = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    if (!canActOnDispute(dispute, req.user)) return res.status(403).json({ success: false, message: 'You cannot add notes to this dispute' });
    if (!req.body.message?.trim()) return res.status(400).json({ success: false, message: 'Note message is required' });

    dispute.history.push({ senderId: req.user._id, message: req.body.message.trim() });
    await dispute.save();
    await audit(req, 'DISPUTE_NOTE_ADDED', dispute);
    res.json({ success: true, data: dispute });
  } catch (err) {
    next(err);
  }
};

export const escalateDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    if (req.user.role !== 'SUPPORT_AGENT' || !canActOnDispute(dispute, req.user)) return res.status(403).json({ success: false, message: 'Only the assigned support agent can escalate this dispute' });
    if (!['OPEN', 'OPENED', 'UNDER_REVIEW'].includes(dispute.status)) return res.status(400).json({ success: false, message: 'Dispute cannot be escalated from its current state' });

    dispute.status = 'ESCALATED';
    dispute.history.push({ senderId: req.user._id, message: req.body.message?.trim() || 'Dispute escalated to operations.' });
    await dispute.save();
    await audit(req, 'DISPUTE_ESCALATED', dispute);
    await NotificationService.notifyRoles({
      roles: ['OPERATIONS_MANAGER', 'PLATFORM_ADMIN'],
      title: 'Dispute escalated to operations',
      message: 'A support dispute requires operations review.',
      type: 'DISPUTE_ESCALATED',
      linkUrl: '/support/dashboard'
    });
    res.json({ success: true, data: dispute });
  } catch (err) {
    next(err);
  }
};

const resolve = async (req, res, next, rejected = false) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    if (!canActOnDispute(dispute, req.user)) return res.status(403).json({ success: false, message: 'You cannot close this dispute' });
    if (!['OPEN', 'OPENED', 'UNDER_REVIEW', 'ESCALATED'].includes(dispute.status)) return res.status(400).json({ success: false, message: 'Dispute is already closed' });

    const notes = req.body.notes?.trim();
    if (!notes) return res.status(400).json({ success: false, message: 'Resolution notes are required' });
    const action = rejected ? 'DISMISS' : req.body.action;
    const validActions = ['FULL_REFUND', 'PARTIAL_REFUND', 'RE_SERVICE', 'DISMISS'];
    if (!validActions.includes(action)) return res.status(400).json({ success: false, message: 'Invalid resolution action' });

    const invoice = await Invoice.findOne({ bookingId: dispute.bookingId });
    if (['FULL_REFUND', 'PARTIAL_REFUND'].includes(action) && !invoice) throw fail('An invoice is required for a refund', 400);
    let refundAmount = 0;
    if (action === 'FULL_REFUND') refundAmount = invoice.totalAmount;
    if (action === 'PARTIAL_REFUND') refundAmount = Number(req.body.amount);
    if (refundAmount > 0) await simulateRefund(invoice, refundAmount);

    dispute.status = rejected ? 'REJECTED' : 'RESOLVED';
    dispute.resolutionDetails = { action, amount: refundAmount, notes, resolvedAt: new Date() };
    dispute.history.push({ senderId: req.user._id, message: `${rejected ? 'Dispute rejected' : 'Dispute resolved'}: ${notes}` });
    await dispute.save();
    await audit(req, rejected ? 'DISPUTE_REJECTED' : 'DISPUTE_RESOLVED', dispute, { action, amount: refundAmount });
    if (refundAmount > 0) {
      await audit(req, 'DISPUTE_REFUND_APPROVED', dispute, { amount: refundAmount, invoiceId: invoice._id.toString() });
      await recordAudit({ req, action: 'REFUND_APPROVED', entityType: 'Invoice', entityId: invoice._id, previousState: { paymentStatus: 'PAID' }, newState: { paymentStatus: invoice.paymentStatus, refundAmount: invoice.refundAmount }, metadata: { disputeId: dispute._id.toString(), amount: refundAmount } });
    }
    await notifyParties(dispute, 'Dispute updated', notes);

    res.json({ success: true, data: dispute });
  } catch (err) {
    next(err);
  }
};

export const resolveDispute = (req, res, next) => resolve(req, res, next, false);
export const rejectDispute = (req, res, next) => resolve(req, res, next, true);
