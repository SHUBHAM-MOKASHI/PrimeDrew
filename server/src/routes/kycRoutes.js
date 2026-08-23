import express from 'express';
import { processIDExtraction, processFaceVerification } from '../controllers/kycController.js';
import { protect } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// Helper middleware for single document file upload
const handleSingleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

// Middleware for dual-file face verification upload (id_card and selfie)
const handleFaceUpload = upload.fields([
  { name: 'id_card', maxCount: 1 },
  { name: 'idCard', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]);

router.post('/extract-id', protect, handleSingleUpload, processIDExtraction);
router.post('/verify-face', protect, handleFaceUpload, processFaceVerification);

export default router;
