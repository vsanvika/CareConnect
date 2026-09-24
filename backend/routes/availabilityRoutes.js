import express from 'express';
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability
} from '../controllers/availabilityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('SERVICE_PROVIDER', 'PLATFORM_ADMIN'));

router.route('/')
  .get(getAvailability)
  .post(createAvailability);

router.route('/:id')
  .patch(updateAvailability)
  .delete(deleteAvailability);

export default router;
