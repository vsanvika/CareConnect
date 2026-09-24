import express from 'express';
import { createReview, getProviderReviews, getCustomerReviews, getReviewForBooking } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/mine', protect, getCustomerReviews);
router.get('/provider/:providerId', getProviderReviews);
router.get('/booking/:bookingId', protect, getReviewForBooking);

export default router;
