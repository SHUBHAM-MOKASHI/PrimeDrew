import express from 'express';
import { applyHostApplication, getHostApplicationStatus } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Host application endpoints (supports both /apply and /apply-host)
router.post('/apply', protect, applyHostApplication);
router.post('/apply-host', protect, applyHostApplication);
router.get('/status', protect, getHostApplicationStatus);
router.get('/host-status', protect, getHostApplicationStatus);

export default router;
