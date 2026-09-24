import express from 'express';
import { getOverviewAnalytics, getAdminAnalytics, getProviderAnalytics, getCustomerAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/overview', protect, authorize('OPERATIONS_MANAGER', 'PLATFORM_ADMIN'), getOverviewAnalytics);
router.get('/admin', protect, authorize('PLATFORM_ADMIN', 'OPERATIONS_MANAGER'), getAdminAnalytics);
router.get('/provider', protect, authorize('SERVICE_PROVIDER'), getProviderAnalytics);
router.get('/customer', protect, authorize('CUSTOMER'), getCustomerAnalytics);

export default router;
