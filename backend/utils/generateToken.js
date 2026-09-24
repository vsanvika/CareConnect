// Utility to generate JWT tokens
import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token containing user id and role.
 * @param {string} userId - MongoDB ObjectId of the user
 * @param {string} role - User role string
 * @returns {string} signed JWT token
 */
export const generateToken = (userId, role) => {
  const payload = { id: userId, role };
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required to issue tokens');
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
};
