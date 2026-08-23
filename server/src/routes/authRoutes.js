import express from 'express';
import { register, login, verifyOTP, getMe, logout, updateAuthKycStatus } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.patch('/kyc-status', protect, updateAuthKycStatus);
router.post('/kyc-status', protect, updateAuthKycStatus);

export default router;
