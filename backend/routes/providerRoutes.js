import express from 'express';
import { getProviderReviews } from '../controllers/reviewController.js';
import { getProviderProfile, updateProviderProfile, searchProviders } from '../controllers/providerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', searchProviders);
router.use(protect);

router.get('/me', authorize('SERVICE_PROVIDER', 'PLATFORM_ADMIN'), getProviderProfile);
router.put('/me', authorize('SERVICE_PROVIDER'), updateProviderProfile);
router.get('/me/reviews', authorize('SERVICE_PROVIDER'), (req, res, next) => {
	req.params.providerId = req.user._id;
	return getProviderReviews(req, res, next);
});
router.get('/:id', authorize('CUSTOMER', 'SERVICE_PROVIDER', 'PLATFORM_ADMIN'), getProviderProfile);
router.get('/:id/reviews', getProviderReviews);

export default router;
