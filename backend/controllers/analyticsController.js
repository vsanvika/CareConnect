import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import Dispute from '../models/Dispute.js';
import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Quote from '../models/Quote.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Review from '../models/Review.js';

const rangeMatch = (field, query) => {
  if (!query.from && !query.to) return {};
  const range = {};
  if (query.from) range.$gte = new Date(query.from);
  if (query.to) range.$lte = new Date(query.to);
  return { [field]: range };
};

const timeSeries = (dateField = 'createdAt') => ({
  $group: {
    _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
    count: { $sum: 1 }
  }
});

export const getOverviewAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProviders = await ProviderProfile.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalDisputes = await Dispute.countDocuments();

    const invoices = await Invoice.find({ paymentStatus: 'PAID' });
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const platformCommission = invoices.reduce((sum, inv) => sum + inv.platformFee, 0);

    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProviders,
        totalBookings,
        totalDisputes,
        totalRevenue,
        platformCommission,
        bookingsByStatus
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const dateMatch = rangeMatch('createdAt', req.query);
    const [bookingsOverTime, revenueOverTime, services, completion, providerPerformance, ratings, disputes] = await Promise.all([
      Booking.aggregate([{ $match: dateMatch }, timeSeries('createdAt'), { $sort: { _id: 1 } }]),
      Invoice.aggregate([{ $match: { paymentStatus: 'PAID', ...dateMatch } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, commission: { $sum: '$platformFee' } } }, { $sort: { _id: 1 } }]),
      ServiceRequest.aggregate([{ $match: dateMatch }, { $group: { _id: '$categoryId', requests: { $sum: 1 } } }, { $lookup: { from: 'servicecategories', localField: '_id', foreignField: '_id', as: 'category' } }, { $project: { _id: 0, name: { $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, 'Uncategorized'] }, requests: 1 } }, { $sort: { requests: -1 } }]),
      Booking.aggregate([{ $match: dateMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: dateMatch }, { $group: { _id: '$providerId', jobs: { $sum: 1 }, completed: { $sum: { $cond: [{ $in: ['$status', ['COMPLETED', 'CUSTOMER_CONFIRMED']] }, 1, 0] } }, cancelled: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } }, earnings: { $sum: '$totalAmount' } } }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'provider' } }, { $project: { _id: 0, providerId: '$_id', name: { $ifNull: [{ $arrayElemAt: ['$provider.name', 0] }, 'Provider'] }, jobs: 1, completed: 1, cancelled: 1, earnings: 1 } }, { $sort: { completed: -1 } }]),
      Review.aggregate([{ $match: dateMatch }, { $group: { _id: '$rating', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Dispute.aggregate([{ $match: dateMatch }, { $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);
    res.json({ success: true, data: { bookingsOverTime, revenueOverTime, services, completion, providerPerformance, ratings, disputes } });
  } catch (err) {
    next(err);
  }
};

export const getProviderAnalytics = async (req, res, next) => {
  try {
    const match = { providerId: req.user._id, ...rangeMatch('createdAt', req.query) };
    const [bookings, earnings, quotes, reviews] = await Promise.all([
      Booking.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Invoice.aggregate([{ $match: { providerId: req.user._id, paymentStatus: { $in: ['PAID', 'PENDING'] }, ...rangeMatch('createdAt', req.query) } }, { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Quote.aggregate([{ $match: { providerId: req.user._id, ...rangeMatch('createdAt', req.query) } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Review.aggregate([{ $match: { providerId: req.user._id, ...rangeMatch('createdAt', req.query) } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }])
    ]);
    const quoteTotal = quotes.reduce((sum, item) => sum + item.count, 0);
    const accepted = quotes.find((item) => item._id === 'ACCEPTED')?.count || 0;
    res.json({ success: true, data: { bookings, earnings: earnings[0] || { total: 0, count: 0 }, quotes, quoteAcceptanceRate: quoteTotal ? Math.round((accepted / quoteTotal) * 100) : 0, reviews: reviews[0] || { average: 0, count: 0 } } });
  } catch (err) {
    next(err);
  }
};

export const getCustomerAnalytics = async (req, res, next) => {
  try {
    const dateMatch = rangeMatch('createdAt', req.query);
    const [requests, bookings, spending] = await Promise.all([
      ServiceRequest.aggregate([{ $match: { customerId: req.user._id, ...dateMatch } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: { customerId: req.user._id, ...dateMatch } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Invoice.aggregate([{ $match: { customerId: req.user._id, paymentStatus: 'PAID', ...dateMatch } }, { $group: { _id: null, total: { $sum: '$totalAmount' }, invoices: { $sum: 1 } } }])
    ]);
    res.json({ success: true, data: { requests, bookings, spending: spending[0] || { total: 0, invoices: 0 } } });
  } catch (err) {
    next(err);
  }
};
