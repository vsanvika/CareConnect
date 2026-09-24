import ProviderProfile from '../models/ProviderProfile.js';
import User from '../models/User.js';
import { recordAudit } from '../utils/recordAudit.js';

const providerProjection = 'name email phone avatarUrl address role isVerified isActive';

export const getProviderProfile = async (req, res, next) => {
  try {
    const providerId = req.params.id || (req.user.role === 'PLATFORM_ADMIN' && req.query.providerId
      ? req.query.providerId
      : req.user._id);
    const [user, profile] = await Promise.all([
      User.findById(providerId).select(providerProjection),
      ProviderProfile.findOne({ userId: providerId }).populate('skills')
    ]);

    if (!user || user.role !== 'SERVICE_PROVIDER' || !profile) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }

    res.json({ success: true, data: { user, providerProfile: profile } });
  } catch (err) {
    next(err);
  }
};

export const updateProviderProfile = async (req, res, next) => {
  try {
    const { name, phone, address, providerProfile = {} } = req.body;
    const user = await User.findById(req.user._id);
    const profile = await ProviderProfile.findOne({ userId: req.user._id });
    if (!user || !profile) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const previousState = { user: { name: user.name, phone: user.phone }, profile: { businessName: profile.businessName, skillTags: profile.skillTags, serviceAreaRadiusKm: profile.serviceAreaRadiusKm } };
    if (name !== undefined) user.name = String(name).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (address) user.address = { ...user.address.toObject(), ...address };
    await user.save();

    const allowedFields = ['businessName', 'skillTags', 'serviceAreas', 'pricing', 'documents', 'experienceYears', 'hourlyRate', 'serviceAreaRadiusKm', 'location', 'bio', 'isAvailableNow'];
    allowedFields.forEach((field) => {
      if (providerProfile[field] !== undefined) profile[field] = providerProfile[field];
    });
    await profile.save();
    await recordAudit({ req, action: 'PROVIDER_PROFILE_UPDATED', entityType: 'ProviderProfile', entityId: profile._id, previousState, newState: { businessName: profile.businessName, skillTags: profile.skillTags, serviceAreaRadiusKm: profile.serviceAreaRadiusKm } });

    res.json({ success: true, data: { user, providerProfile: profile } });
  } catch (err) {
    next(err);
  }
};

export const searchProviders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const userFilter = { role: 'SERVICE_PROVIDER', isActive: true };
    if (req.query.location) userFilter['address.city'] = new RegExp(String(req.query.location).trim(), 'i');

    const users = await User.find(userFilter).select(providerProjection).lean();
    const userIds = users.map((user) => user._id);
    const profileFilter = { userId: { $in: userIds } };
    if (req.query.category) profileFilter.skills = req.query.category;
    if (req.query.skill) profileFilter.skillTags = { $regex: String(req.query.skill).trim(), $options: 'i' };
    if (req.query.ratingMin || req.query.ratingMax) profileFilter.ratingAverage = {};
    if (req.query.ratingMin) profileFilter.ratingAverage.$gte = Number(req.query.ratingMin);
    if (req.query.ratingMax) profileFilter.ratingAverage.$lte = Number(req.query.ratingMax);
    if (req.query.priceMin || req.query.priceMax) profileFilter.hourlyRate = {};
    if (req.query.priceMin) profileFilter.hourlyRate.$gte = Number(req.query.priceMin);
    if (req.query.priceMax) profileFilter.hourlyRate.$lte = Number(req.query.priceMax);
    if (req.query.availability !== undefined) profileFilter.isAvailableNow = req.query.availability === 'true';
    if (req.query.experienceMin || req.query.experienceMax) profileFilter.experienceYears = {};
    if (req.query.experienceMin) profileFilter.experienceYears.$gte = Number(req.query.experienceMin);
    if (req.query.experienceMax) profileFilter.experienceYears.$lte = Number(req.query.experienceMax);

    const [profiles, total] = await Promise.all([
      ProviderProfile.find(profileFilter).populate('skills').sort({ ratingAverage: -1, ratingCount: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ProviderProfile.countDocuments(profileFilter)
    ]);
    const usersById = new Map(users.map((user) => [user._id.toString(), user]));
    const data = profiles.map((profile) => ({ ...profile, user: usersById.get(profile.userId.toString()) }));
    res.json({ success: true, data, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};