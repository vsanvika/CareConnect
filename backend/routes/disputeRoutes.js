import express from 'express';
import {
  createDispute,
  getDisputes,
  getDisputeById,
  assignDispute,
  addDisputeNote,
  escalateDispute,
  resolveDispute,
  rejectDispute
} from '../controllers/disputeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('CUSTOMER'), createDispute);
router.get('/', getDisputes);
router.get('/:id', getDisputeById);
router.patch('/:id/assign', authorize('SUPPORT_AGENT', 'OPERATIONS_MANAGER', 'PLATFORM_ADMIN'), assignDispute);
router.post('/:id/notes', authorize('SUPPORT_AGENT', 'OPERATIONS_MANAGER', 'PLATFORM_ADMIN'), addDisputeNote);
router.post('/:id/escalate', authorize('SUPPORT_AGENT'), escalateDispute);
router.post('/:id/resolve', authorize('SUPPORT_AGENT', 'OPERATIONS_MANAGER', 'PLATFORM_ADMIN'), resolveDispute);
router.post('/:id/reject', authorize('SUPPORT_AGENT', 'OPERATIONS_MANAGER', 'PLATFORM_ADMIN'), rejectDispute);

export default router;
