import express from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicleController.js';
import { protect, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);

// Protected host/admin routes
router.post('/', protect, authorizeRoles('host', 'admin'), createVehicle);
router.put('/:id', protect, authorizeRoles('host', 'admin'), updateVehicle);
router.delete('/:id', protect, authorizeRoles('host', 'admin'), deleteVehicle);

export default router;
