import express from 'express';
import { getNotifications, markNotificationAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.patch('/read', markAllAsRead);
router.put('/:id/read', markNotificationAsRead);

export default router;
