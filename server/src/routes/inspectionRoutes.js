import express from 'express';
import {
  processVehicleInspection,
  analyzeUniversalVehicleDamage,
  getBookingAudit,
  fileDispute,
  resolveDisputeHost
} from '../controllers/inspectionController.js';
import { optionalAuth, protect, authenticate } from '../middlewares/auth.js';
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

router.post('/detect-damage', optionalAuth, handleUpload, processVehicleInspection);
router.post('/analyze-damage', optionalAuth, analyzeUniversalVehicleDamage);
router.post('/analyze-universal', optionalAuth, analyzeUniversalVehicleDamage);
router.post('/analyze', optionalAuth, analyzeUniversalVehicleDamage);

// Escrow Hold, Audit & Dispute Subsystem Routes
router.get('/:bookingId/audit', optionalAuth, getBookingAudit);
router.post('/:bookingId/dispute', optionalAuth, fileDispute);
router.post('/:bookingId/resolve-host', optionalAuth, resolveDisputeHost);

export default router;
