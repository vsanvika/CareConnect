import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { generateToken } from '../utils/generateToken.js';
import { NotificationService } from '../services/notificationService.js';
import { recordAudit } from '../utils/recordAudit.js';

// @desc Auth user & get token
// @route POST /api/v1/auth/login
// Updated loginUser with cookie handling
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (user && user.isActive && (await user.matchPassword(password))) {
      const providerProfile = user.role === 'SERVICE_PROVIDER'
        ? await ProviderProfile.findOne({ userId: user._id })
        : null;
      const token = generateToken(user._id, user.role);
      // Set token in HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          phone: user.phone,
          address: user.address,
          providerProfile,
          token
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (err) {
    next(err);
  }
};

// New logout controller
export const logoutUser = async (req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (String(newPassword || '').length < 8 || String(newPassword).length > 128) {
      return res.status(400).json({ success: false, message: 'New password must be between 8 and 128 characters' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.matchPassword(currentPassword))) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    await recordAudit({ req, action: 'PASSWORD_CHANGED', entityType: 'User', entityId: user._id, metadata: { changed: true } });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};



// @desc Register new user
// @route POST /api/v1/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, businessName, hourlyRate } = req.body;
    if (!String(name || '').trim() || String(name).trim().length > 120) return res.status(400).json({ success: false, message: 'A valid name is required' });
    if (!String(email || '').trim() || String(email).length > 254) return res.status(400).json({ success: false, message: 'A valid email is required' });
    if (String(password || '').length < 8 || String(password).length > 128) return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters' });

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const requestedRole = role === 'SERVICE_PROVIDER' ? 'SERVICE_PROVIDER' : 'CUSTOMER';
    const user = await User.create({
      name,
      email,
      password,
      role: requestedRole,
      phone: phone || ''
    });

    let providerProfile = null;
    if (user.role === 'SERVICE_PROVIDER') {
      providerProfile = await ProviderProfile.create({
        userId: user._id,
        businessName: businessName || `${user.name} Services`,
        hourlyRate: hourlyRate || 50,
        verificationStatus: 'PENDING'
      });
      await NotificationService.notifyRoles({
        roles: ['OPERATIONS_MANAGER', 'PLATFORM_ADMIN'],
        title: 'Provider verification request',
        message: `${user.name} submitted a provider profile for verification.`,
        type: 'PROVIDER_VERIFICATION_REQUEST',
        linkUrl: '/ops/dashboard'
      });
    }

    await recordAudit({ req, action: 'USER_CREATED', entityType: 'User', entityId: user._id, newState: { role: user.role, email: user.email }, metadata: { registration: true } });
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        providerProfile,
        token: generateToken(user._id, user.role)
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get user profile
// @route GET /api/v1/auth/me
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const providerProfile = user.role === 'SERVICE_PROVIDER'
      ? await ProviderProfile.findOne({ userId: user._id }).populate('skills')
      : null;

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        providerProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Update user profile
// @route PUT /api/v1/auth/profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const previousState = { name: user.name, phone: user.phone, address: user.address?.toObject?.() || user.address };
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    if (req.body.address) user.address = { ...user.address, ...req.body.address };

    const updatedUser = await user.save();

    if (user.role === 'SERVICE_PROVIDER' && req.body.providerProfile) {
      const allowedProviderFields = ['businessName', 'skillTags', 'serviceAreas', 'pricing', 'documents', 'experienceYears', 'hourlyRate', 'serviceAreaRadiusKm', 'location', 'bio', 'isAvailableNow'];
      const providerUpdates = Object.fromEntries(allowedProviderFields.filter((field) => req.body.providerProfile[field] !== undefined).map((field) => [field, req.body.providerProfile[field]]));
      await ProviderProfile.findOneAndUpdate({ userId: user._id }, { $set: providerUpdates }, { new: true, runValidators: true });
    }

    await recordAudit({ req, action: 'USER_PROFILE_UPDATED', entityType: 'User', entityId: user._id, previousState, newState: { name: updatedUser.name, phone: updatedUser.phone, address: updatedUser.address } });

    res.json({ success: true, data: updatedUser });
  } catch (err) {
    next(err);
  }
};
