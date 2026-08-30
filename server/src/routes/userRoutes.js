import express from 'express';
import { updateKycStatus, applyHostApplication, getHostApplicationStatus } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.patch('/kyc-status', protect, updateKycStatus);
router.post('/kyc-status', protect, updateKycStatus);

router.post('/apply-host', protect, applyHostApplication);
router.post('/apply', protect, applyHostApplication);
router.get('/host-status', protect, getHostApplicationStatus);
router.get('/status', protect, getHostApplicationStatus);

export default router;
