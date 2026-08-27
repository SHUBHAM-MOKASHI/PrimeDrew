import express from 'express';
import {
  getAdminStats,
  getHostApplications,
  approveHostApplication,
  rejectHostApplication,
  getAllUsers,
  updateUserRole,
  updateUserKyc,
  getAdminFleet,
  approveVehicleListing,
  rejectVehicleListing
} from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Apply protect and requireAdmin across all admin endpoints
router.use(protect);
router.use(requireAdmin);

router.get('/stats', getAdminStats);

router.get('/host-applications', getHostApplications);
router.patch('/host-applications/:userId/approve', approveHostApplication);
router.patch('/host-applications/:userId/reject', rejectHostApplication);

router.get('/users', getAllUsers);
router.patch('/users/:userId/role', updateUserRole);
router.patch('/users/:userId/kyc', updateUserKyc);

router.get('/fleet', getAdminFleet);
router.patch('/vehicles/:vehicleId/approve', approveVehicleListing);
router.patch('/vehicles/:vehicleId/reject', rejectVehicleListing);

export default router;
