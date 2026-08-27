import express from 'express';
import {
  createBooking,
  getUserBookings,
  getHostBookings,
  updateBookingStatus,
  generateHandoverOtp,
  verifyHandoverOtp,
  completeTrip,
  updateTripLocation
} from '../controllers/bookingController.js';
import { protect, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// Protected booking routes
router.post('/', protect, authorizeRoles('renter', 'USER', 'ADMIN', 'admin'), createBooking);
router.get('/user', protect, getUserBookings);
router.get('/host', protect, authorizeRoles('host', 'HOST', 'ADMIN', 'admin'), getHostBookings);
router.patch('/:id/status', protect, updateBookingStatus);

// Handover OTP & Trip Timer Endpoints
router.post('/:id/generate-handover-otp', protect, generateHandoverOtp);
router.post('/:id/verify-handover-otp', protect, verifyHandoverOtp);
router.post('/:id/complete-trip', protect, completeTrip);
router.patch('/:id/location', protect, updateTripLocation);

export default router;
