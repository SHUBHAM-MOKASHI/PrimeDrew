import express from 'express';
import { updateKYCStatus } from '../controllers/kycController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.patch('/kyc-status', protect, updateKYCStatus);

export default router;
