import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { reassignProvider } from '../controllers/reassignmentController.js';

const router = express.Router();
router.use(protect);
router.post('/bookings/:id/reassign', reassignProvider);

export default router;
