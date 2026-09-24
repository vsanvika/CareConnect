import mongoose from 'mongoose';
import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import ServiceCategory from '../models/ServiceCategory.js';
import Skill from '../models/Skill.js';
import Booking from '../models/Booking.js';
import Dispute from '../models/Dispute.js';
import Invoice from '../models/Invoice.js';
import Review from '../models/Review.js';
import AuditLog from '../models/AuditLog.js';
import { recordAudit } from '../utils/recordAudit.js';

const pageOptions = (query) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.min(100, Math.max(1, Number(query.limit) || 20)),
  search: String(query.search || '').trim()
});

const audit = (req, action, targetCollection, targetId, details = {}, previousState = null, newState = null) => recordAudit({ req, action, entityType: targetCollection, entityId: targetId, previousState, newState, metadata: details });

const paged = async (model, filter, options, populate = []) => {
  const skip = (options.page - 1) * options.limit;
  const [data, total] = await Promise.all([
    model.find(filter).populate(populate).sort({ createdAt: -1 }).skip(skip).limit(options.limit),
    model.countDocuments(filter)
  ]);
  return { data, total, page: options.page, limit: options.limit, pages: Math.ceil(total / options.limit) };
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProviders, verifiedProviders, activeBookings, completedJobs, openDisputes, rating, revenue] = await Promise.all([
      User.countDocuments(),
      ProviderProfile.countDocuments(),
      ProviderProfile.countDocuments({ verificationStatus: 'VERIFIED' }),
      Booking.countDocuments({ status: { $in: ['PENDING', 'CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS'] } }),
      Booking.countDocuments({ status: { $in: ['COMPLETED', 'CUSTOMER_CONFIRMED'] } }),
      Dispute.countDocuments({ status: { $in: ['OPEN', 'OPENED', 'UNDER_REVIEW', 'ESCALATED'] } }),
      Review.aggregate([{ $group: { _id: null, average: { $avg: '$rating' } } }]),
      Invoice.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }])
    ]);
    res.json({ success: true, data: {
      totalUsers,
      totalProviders,
      verifiedProviders,
      activeBookings,
      completedJobs,
      openDisputes,
      averageRating: rating[0] ? Math.round(rating[0].average * 10) / 10 : 0,
      revenue: revenue[0]?.total || 0
    } });
  } catch (err) { next(err); }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const options = pageOptions(req.query);
    const filter = options.search ? { $or: [{ name: new RegExp(options.search, 'i') }, { email: new RegExp(options.search, 'i') }] } : {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.active !== undefined) filter.isActive = req.query.active === 'true';
    if (req.query.status) filter.isActive = req.query.status === 'ACTIVE';
    res.json({ success: true, ...await paged(User, filter, options, []) });
  } catch (err) { next(err); }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account' });
    const existingUser = await User.findById(req.params.id).select('name email role isActive');
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: Boolean(req.body.isActive) }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await audit(req, user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', 'User', user._id, { isActive: user.isActive }, { isActive: existingUser?.isActive }, { isActive: user.isActive });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const getAllProviders = async (req, res, next) => {
  try {
    const options = pageOptions(req.query);
    const userFilter = options.search ? { $or: [{ name: new RegExp(options.search, 'i') }, { email: new RegExp(options.search, 'i') }] } : {};
    if (req.query.status) {
      const matchingProfiles = await ProviderProfile.find({ verificationStatus: req.query.status }).select('userId');
      userFilter._id = { $in: matchingProfiles.map((profile) => profile.userId) };
    }
    const users = await User.find({ role: 'SERVICE_PROVIDER', ...userFilter }).select('-password').sort({ createdAt: -1 }).skip((options.page - 1) * options.limit).limit(options.limit);
    const total = await User.countDocuments({ role: 'SERVICE_PROVIDER', ...userFilter });
    const profiles = await ProviderProfile.find({ userId: { $in: users.map((user) => user._id) } });
    const profileMap = new Map(profiles.map((profile) => [profile.userId.toString(), profile]));
    const data = users.map((user) => ({ user, profile: profileMap.get(user._id.toString()) || null }));
    res.json({ success: true, data, total, page: options.page, limit: options.limit, pages: Math.ceil(total / options.limit) });
  } catch (err) { next(err); }
};

const setProviderVerification = async (req, res, next, verificationStatus) => {
  try {
    const existing = await ProviderProfile.findOne({ userId: req.params.id }).select('verificationStatus');
    const profile = await ProviderProfile.findOneAndUpdate({ userId: req.params.id }, { verificationStatus }, { new: true });
    if (!profile) return res.status(404).json({ success: false, message: 'Provider profile not found' });
    await audit(req, `PROVIDER_${verificationStatus}`, 'ProviderProfile', profile._id, { verificationStatus }, { verificationStatus: existing?.verificationStatus }, { verificationStatus: profile.verificationStatus });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

export const verifyProvider = (req, res, next) => setProviderVerification(req, res, next, 'VERIFIED');
export const rejectProvider = (req, res, next) => setProviderVerification(req, res, next, 'REJECTED');

export const suspendProvider = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'SERVICE_PROVIDER' }, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Provider not found' });
    await audit(req, 'PROVIDER_SUSPENDED', 'User', user._id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const getAllCategories = async (req, res, next) => {
  try {
    const options = pageOptions(req.query);
    const filter = {};
    if (options.search) filter.$or = [{ name: new RegExp(options.search, 'i') }, { description: new RegExp(options.search, 'i') }];
    if (req.query.status) filter.isActive = req.query.status === 'ACTIVE';
    const skip = (options.page - 1) * options.limit;
    const [data, total] = await Promise.all([
      ServiceCategory.find(filter).sort({ name: 1 }).skip(skip).limit(options.limit),
      ServiceCategory.countDocuments(filter)
    ]);
    res.json({ success: true, data, total, page: options.page, limit: options.limit, pages: Math.ceil(total / options.limit) });
  } catch (err) { next(err); }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.create({ ...req.body, slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
    await audit(req, 'CATEGORY_CREATED', 'ServiceCategory', category._id);
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    await audit(req, 'CATEGORY_UPDATED', 'ServiceCategory', category._id, req.body);
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    await audit(req, 'CATEGORY_DEACTIVATED', 'ServiceCategory', category._id);
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
};

export const getAllSkills = async (req, res, next) => {
  try {
    const options = pageOptions(req.query);
    const filter = options.search ? { name: new RegExp(options.search, 'i') } : {};
    if (req.query.status) filter.isActive = req.query.status === 'ACTIVE';
    res.json({ success: true, ...await paged(Skill, filter, options, [{ path: 'category', select: 'name slug' }]) });
  } catch (err) { next(err); }
};

export const createSkill = async (req, res, next) => {
  try { const skill = await Skill.create(req.body); await audit(req, 'SKILL_CREATED', 'Skill', skill._id); res.status(201).json({ success: true, data: skill }); } catch (err) { next(err); }
};
export const updateSkill = async (req, res, next) => {
  try { const skill = await Skill.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }); if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' }); await audit(req, 'SKILL_UPDATED', 'Skill', skill._id, req.body); res.json({ success: true, data: skill }); } catch (err) { next(err); }
};
export const deleteSkill = async (req, res, next) => {
  try { const skill = await Skill.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }); if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' }); await audit(req, 'SKILL_DEACTIVATED', 'Skill', skill._id); res.json({ success: true, data: skill }); } catch (err) { next(err); }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const options = pageOptions(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.provider && mongoose.isValidObjectId(req.query.provider)) filter.providerId = req.query.provider;
    if (req.query.customer && mongoose.isValidObjectId(req.query.customer)) filter.customerId = req.query.customer;
    if (req.query.date) {
      const date = new Date(req.query.date);
      filter.scheduledStart = { $gte: new Date(date.setHours(0, 0, 0, 0)), $lt: new Date(date.setHours(23, 59, 59, 999)) };
    }
    if (req.query.from || req.query.to) {
      filter.scheduledStart = {};
      if (req.query.from) filter.scheduledStart.$gte = new Date(req.query.from);
      if (req.query.to) filter.scheduledStart.$lte = new Date(req.query.to);
    }
    if (options.search && mongoose.isValidObjectId(options.search)) filter._id = options.search;
    res.json({ success: true, ...await paged(Booking, filter, options, [{ path: 'customerId', select: 'name email' }, { path: 'providerId', select: 'name email' }, { path: 'requestId', select: 'title' }]) });
  } catch (err) { next(err); }
};

export const getAllDisputes = async (req, res, next) => {
  try {
    const options = pageOptions(req.query);
    const filter = req.query.status ? { status: req.query.status } : {};
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
    res.json({ success: true, ...await paged(Dispute, filter, options, [{ path: 'openedBy', select: 'name email' }, { path: 'assignedAgentId', select: 'name email' }, { path: 'bookingId' }]) });
  } catch (err) { next(err); }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const [status, revenue, disputes] = await Promise.all([
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Invoice.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, fees: { $sum: '$platformFee' } } }]),
      Dispute.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);
    res.json({ success: true, data: { bookingsByStatus: status, revenue: revenue[0] || { revenue: 0, fees: 0 }, disputesByStatus: disputes } });
  } catch (err) { next(err); }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const options = pageOptions(req.query);
    const filter = {};
    const auditAnd = [];
    if (req.query.action) filter.action = req.query.action;
    if (req.query.entityType) auditAnd.push({ $or: [{ entityType: req.query.entityType }, { targetCollection: req.query.entityType }] });
    if (req.query.user && mongoose.isValidObjectId(req.query.user)) filter.actorId = req.query.user;
    if (req.query.date) {
      const date = new Date(req.query.date);
      filter.createdAt = { $gte: new Date(date.setHours(0, 0, 0, 0)), $lt: new Date(date.setHours(23, 59, 59, 999)) };
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }
    if (options.search) {
      auditAnd.push({ $or: [{ action: new RegExp(options.search, 'i') }, { entityType: new RegExp(options.search, 'i') }, { targetCollection: new RegExp(options.search, 'i') }, { targetId: new RegExp(options.search, 'i') }] });
    }
    if (auditAnd.length) filter.$and = auditAnd;
    res.json({ success: true, ...await paged(AuditLog, filter, options, [{ path: 'actorId', select: 'name email role' }]) });
  } catch (err) { next(err); }
};
