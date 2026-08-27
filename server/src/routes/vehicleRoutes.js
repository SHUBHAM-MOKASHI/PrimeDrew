import express from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicleController.js';
import { protect, authorizeRoles } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

const handleVehicleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

// Public routes
router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);

// Protected host/admin routes
router.post('/', protect, authorizeRoles('host', 'admin'), handleVehicleUpload, createVehicle);
router.put('/:id', protect, authorizeRoles('host', 'admin'), handleVehicleUpload, updateVehicle);
router.delete('/:id', protect, authorizeRoles('host', 'admin'), deleteVehicle);

export default router;
