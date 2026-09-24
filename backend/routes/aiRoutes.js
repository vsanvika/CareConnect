import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createDiagnosis, analyzeImage, estimatePricing } from '../controllers/aiController.js';

const router = express.Router();
router.use(protect);

router.post('/diagnosis', createDiagnosis);
router.post('/image-analysis', analyzeImage);
router.post('/price-estimate', estimatePricing);

export default router;
