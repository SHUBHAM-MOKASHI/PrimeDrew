import express from 'express';
import { processVehicleInspection } from '../controllers/inspectionController.js';
import { protect } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// Helper middleware to handle single file upload with any field name (e.g. 'file', 'image')
const handleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

router.post('/detect-damage', protect, handleUpload, processVehicleInspection);

export default router;
