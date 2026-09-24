import express from 'express';
import { createInvoice, getMyInvoices, getInvoiceById, payInvoice } from '../controllers/invoiceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createInvoice);
router.get('/', getMyInvoices);
router.get('/:id', getInvoiceById);
router.post('/:id/pay', payInvoice);

export default router;
