import express from 'express';
import { loginUser, logoutUser, registerUser, getUserProfile, updateUserProfile, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/register', registerUser);
router.get('/me', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/change-password', protect, authRateLimiter, changePassword);

export default router;
