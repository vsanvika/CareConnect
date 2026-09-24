import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getHomeProfile, saveHomeProfile, getMaintenanceHistory, createMaintenanceRecord, getMaintenanceRecommendations } from '../controllers/customerController.js';

const router = express.Router();
router.use(protect);

router.get('/me/home', getHomeProfile);
router.post('/me/home', saveHomeProfile);
router.get('/me/maintenance', getMaintenanceHistory);
router.post('/maintenance', createMaintenanceRecord);
router.get('/maintenance/recommendations', getMaintenanceRecommendations);

export default router;
