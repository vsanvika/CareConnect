import Invoice from '../models/Invoice.js';
import Booking from '../models/Booking.js';
import Quote from '../models/Quote.js';
import { InvoiceService } from '../services/invoiceService.js';
import { PaymentService } from '../services/paymentService.js';
import { recordAudit } from '../utils/recordAudit.js';

const canAccessInvoice = (invoice, user) => (
  ['PLATFORM_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_AGENT'].includes(user.role) ||
  (invoice.customerId?._id || invoice.customerId).toString() === user._id.toString() ||
  (invoice.providerId?._id || invoice.providerId).toString() === user._id.toString()
);

export const createInvoice = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.body.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!['COMPLETED', 'CUSTOMER_CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Invoice can only be generated after job completion' });
    }
    if (
      !['PLATFORM_ADMIN', 'OPERATIONS_MANAGER'].includes(req.user.role) &&
      booking.customerId.toString() !== req.user._id.toString() &&
      booking.providerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to create this invoice' });
    }

    const quote = await Quote.findById(booking.quoteId);
    const invoice = await InvoiceService.generateInvoiceForBooking(booking, quote || { amount: booking.totalAmount, breakdown: {} });
    await recordAudit({ req, action: 'INVOICE_CREATED', entityType: 'Invoice', entityId: invoice._id, newState: { paymentStatus: invoice.paymentStatus, totalAmount: invoice.totalAmount }, metadata: { bookingId: booking._id.toString() } });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

export const getMyInvoices = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'CUSTOMER') filter.customerId = req.user._id;
    else if (req.user.role === 'SERVICE_PROVIDER') filter.providerId = req.user._id;

    const invoices = await Invoice.find(filter)
      .populate('customerId', 'name email')
      .populate('providerId', 'name email')
      .populate('bookingId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email phone address')
      .populate('providerId', 'name email phone')
      .populate('bookingId');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (!canAccessInvoice(invoice, req.user)) return res.status(403).json({ success: false, message: 'Not authorized to view this invoice' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

export const payInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (!canAccessInvoice(invoice, req.user) || invoice.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the invoice customer can make this payment' });
    }
    if (invoice.paymentStatus !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Invoice is already ${invoice.paymentStatus.toLowerCase()}` });
    }

    const updatedInvoice = await PaymentService.processSimulatedPayment(invoice, {
      simulateFailure: req.body?.simulateFailure === true
    });
    if (updatedInvoice.paymentProcessingStatus === 'SUCCESS') {
      await recordAudit({ req, action: 'PAYMENT_COMPLETED', entityType: 'Invoice', entityId: invoice._id, previousState: { paymentStatus: invoice.paymentStatus }, newState: { paymentStatus: updatedInvoice.paymentStatus, transactionReference: updatedInvoice.transactionReference }, metadata: { amount: updatedInvoice.totalAmount } });
    }
    await recordAudit({ req, action: updatedInvoice.paymentProcessingStatus === 'SUCCESS' ? 'SIMULATED_PAYMENT_SUCCEEDED' : 'SIMULATED_PAYMENT_FAILED', entityType: 'Invoice', entityId: invoice._id, previousState: { paymentStatus: invoice.paymentStatus }, newState: { paymentStatus: updatedInvoice.paymentStatus }, metadata: { processingStatus: updatedInvoice.paymentProcessingStatus } });

    res.json({ success: true, message: updatedInvoice.paymentProcessingStatus === 'SUCCESS' ? 'Payment successful' : 'Payment failed', data: updatedInvoice });
  } catch (err) {
    next(err);
  }
};
