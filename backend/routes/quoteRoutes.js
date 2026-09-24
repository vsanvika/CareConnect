import express from 'express';
import { submitQuote, getQuotesForRequest, getMyQuotes, acceptQuote, withdrawQuote, rejectQuote, updateQuote } from '../controllers/quoteController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('SERVICE_PROVIDER', 'PLATFORM_ADMIN'), submitQuote);
router.get('/mine', authorize('SERVICE_PROVIDER'), getMyQuotes);
router.get('/request/:requestId', getQuotesForRequest);
router.post('/:id/accept', authorize('CUSTOMER', 'PLATFORM_ADMIN'), acceptQuote);
router.post('/:id/reject', authorize('CUSTOMER', 'PLATFORM_ADMIN'), rejectQuote);
router.post('/:id/withdraw', authorize('SERVICE_PROVIDER', 'PLATFORM_ADMIN'), withdrawQuote);
router.put('/:id', authorize('SERVICE_PROVIDER', 'PLATFORM_ADMIN'), updateQuote);

export default router;
