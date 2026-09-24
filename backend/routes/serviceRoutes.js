import express from 'express';
import { getServices, createService } from '../controllers/serviceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getServices);
router.get('/:id', async (req, res, next) => {
	try {
		const ServiceCategory = (await import('../models/ServiceCategory.js')).default;
		const service = await ServiceCategory.findOne({ _id: req.params.id, isActive: true });
		if (!service) return res.status(404).json({ success: false, message: 'Service category not found' });
		res.json({ success: true, data: service });
	} catch (err) { next(err); }
});
router.post('/', protect, authorize('PLATFORM_ADMIN', 'OPERATIONS_MANAGER'), createService);

export default router;
