import express from 'express';
import { updateKycStatus } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.patch('/kyc-status', protect, updateKycStatus);
router.post('/kyc-status', protect, updateKycStatus);

export default router;
