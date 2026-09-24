import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllProviders,
  verifyProvider,
  rejectProvider,
  suspendProvider,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getAllBookings,
  getAllDisputes,
  getAnalytics,
  getAuditLogs
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('PLATFORM_ADMIN'));

// Dashboard stats
router.get('/dashboard', getDashboardStats);

// Users management
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

// Providers management
router.get('/providers', getAllProviders);
router.patch('/providers/:id/verify', verifyProvider);
router.patch('/providers/:id/reject', rejectProvider);
router.patch('/providers/:id/suspend', suspendProvider);

// Categories management
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.patch('/pricing/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Skills management
router.get('/skills', getAllSkills);
router.post('/skills', createSkill);
router.patch('/skills/:id', updateSkill);
router.delete('/skills/:id', deleteSkill);

// Bookings management
router.get('/bookings', getAllBookings);

// Disputes management
router.get('/disputes', getAllDisputes);

// Analytics
router.get('/analytics', getAnalytics);

// Audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
