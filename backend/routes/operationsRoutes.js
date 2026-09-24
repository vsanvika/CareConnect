import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  getOperationsStats,
  getOperationsBookings,
  getOperationsProviders,
  assignOperationsProvider,
  getOperationsEscalations
} from '../controllers/operationsController.js';

const router = express.Router();
router.use(protect, authorize('OPERATIONS_MANAGER', 'PLATFORM_ADMIN'));

router.get('/dashboard', getOperationsStats);
router.get('/bookings', getOperationsBookings);
router.get('/jobs', getOperationsBookings);
router.get('/providers', getOperationsProviders);
router.patch('/bookings/:id/assign', assignOperationsProvider);
router.get('/escalations', getOperationsEscalations);

export default router;
