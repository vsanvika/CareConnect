import express from 'express';
import {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  cancelServiceRequest
} from '../controllers/requestController.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { NotificationService } from '../services/notificationService.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(authorize('CUSTOMER', 'PLATFORM_ADMIN'), upload.array('images', 5), createServiceRequest)
  .get(getServiceRequests);

router.route('/:id')
  .get(getServiceRequestById);

router.patch('/:id/cancel', cancelServiceRequest);
router.post('/:id/emergency', authorize('CUSTOMER', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const { emergencyReason, confirmedEmergency } = req.body;
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.customerId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized to mark this request as emergency' });
    if (!confirmedEmergency) return res.status(400).json({ success: false, message: 'Use Emergency only when immediate assistance is required. Please confirm the emergency request.' });
    if (!emergencyReason) return res.status(400).json({ success: false, message: 'Emergency requests require an emergency reason.' });
    request.priority = 'EMERGENCY';
    request.urgency = 'EMERGENCY';
    request.emergencyReason = emergencyReason;
    request.emergencyCreatedAt = new Date();
    request.responseDeadline = new Date(Date.now() + 60 * 60 * 1000);
    await request.save();
    await NotificationService.notifyRoles({
      roles: ['OPERATIONS_MANAGER', 'PLATFORM_ADMIN'],
      title: 'Emergency request confirmed',
      message: `Emergency attention requested for "${request.title}".`,
      type: 'EMERGENCY_REQUEST',
      linkUrl: `/ops/dashboard`
    });
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
});

export default router;
