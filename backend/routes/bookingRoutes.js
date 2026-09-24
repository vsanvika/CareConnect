import express from 'express';
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  uploadJobEvidence,
  getJobEvidence,
  updateJobEvidence,
  cancelBooking
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getBookings);
router.get('/:id', getBookingById);
router.post('/', authorize('CUSTOMER', 'PLATFORM_ADMIN'), createBooking);
router.put('/:id/status', updateBookingStatus);
router.patch('/:id/status', updateBookingStatus);
router.post('/:id/cancel', cancelBooking);
router.get('/:id/evidence', getJobEvidence);
router.post('/:id/evidence', upload.array('files', 5), uploadJobEvidence);
router.patch('/:id/evidence/:evidenceId', updateJobEvidence);

export default router;
