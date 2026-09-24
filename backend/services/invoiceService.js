import Invoice from '../models/Invoice.js';

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const calculateInvoiceTotals = ({ breakdown = {}, amount = 0, additionalCharges = [], discount = 0 }) => {
  const labor = roundMoney(Math.max(0, Number(breakdown.labor ?? Number(amount) * 0.7)));
  const parts = roundMoney(Math.max(0, Number(breakdown.materials ?? Number(amount) * 0.2)));
  const serviceFee = roundMoney(Math.max(0, Number(breakdown.calloutFee ?? Number(amount) * 0.1)));
  const additionalServices = roundMoney(
    additionalCharges.reduce((sum, charge) => sum + Math.max(0, Number(charge.amount) || 0), 0)
  );
  const subtotal = roundMoney(labor + parts + serviceFee + additionalServices);
  const safeDiscount = roundMoney(Math.min(Math.max(0, Number(discount) || 0), subtotal));
  const taxableAmount = roundMoney(subtotal - safeDiscount);
  const taxRate = Number(process.env.INVOICE_TAX_RATE ?? 0.05);
  const tax = roundMoney(taxableAmount * taxRate);
  const platformFee = roundMoney(subtotal * 0.1);
  const totalAmount = roundMoney(taxableAmount + tax);

  return { labor, parts, serviceFee, additionalServices, discount: safeDiscount, subtotal, platformFee, tax, totalAmount };
};

export class InvoiceService {
  static async generateInvoiceForBooking(booking, quote) {
    const existingInvoice = await Invoice.findOne({ bookingId: booking._id });
    if (existingInvoice) return existingInvoice;

    const totals = calculateInvoiceTotals({
      breakdown: quote.breakdown,
      amount: quote.amount,
      additionalCharges: quote.additionalCharges || []
    });
    const additionalCharges = quote.additionalCharges || [];
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    return Invoice.create({
      bookingId: booking._id,
      invoiceNumber,
      customerId: booking.customerId,
      providerId: booking.providerId,
      lineItems: [
        { description: 'Labour', amount: totals.labor },
        { description: 'Parts', amount: totals.parts },
        ...additionalCharges.map((charge) => ({ description: charge.description, amount: charge.amount })),
        { description: 'Service Fee', amount: totals.serviceFee }
      ],
      ...totals,
      paymentStatus: 'PENDING',
      paymentProcessingStatus: 'IDLE'
    });
  }
}
