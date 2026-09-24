import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import User from '../models/User.js';

/**
 * Protect routes - verify JWT and attach user to req
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  // Expect token in HTTP-only cookie or Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError('Not authorized, no token', 401));
  }

  try {
    if (!process.env.JWT_SECRET) return next(new ApiError('Authentication is not configured', 500));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role isActive');
    if (!user || !user.isActive || user.role !== decoded.role) {
      return next(new ApiError('Not authorized', 401));
    }
    req.user = { _id: user._id, role: user.role };
    next();
  } catch (err) {
    return next(new ApiError('Not authorized, token failed', 401));
  }
});

/**
 * Role-based authorization middleware
 * @param  {...string} roles - allowed roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError('User role not authorized', 403));
    }
    next();
  };
};

/**
 * Check resource ownership
 * @param {Function} getResource - async function that returns the resource containing a userId field
 * @param {String} paramIdName - name of the route param that holds the resource id
 */
export const checkResourceOwnership = (getResource, paramIdName = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resource = await getResource(req.params[paramIdName]);
    if (!resource) {
      return next(new ApiError('Resource not found', 404));
    }
    // Allow admins or owners
    if (
      req.user.role === 'PLATFORM_ADMIN' ||
      (resource.userId && resource.userId.toString() === req.user._id.toString())
    ) {
      req.resource = resource;
      return next();
    }
    return next(new ApiError('Not authorized to access this resource', 403));
  });
};
