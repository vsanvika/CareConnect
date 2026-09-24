import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getProtectedUpload } from '../controllers/fileController.js';

const router = express.Router();
router.get('/:filename', protect, getProtectedUpload);

export default router;