import express from 'express';
import {
  createBooking,
  getUserBookings,
  getHostBookings,
  updateBookingStatus
} from '../controllers/bookingController.js';
import { protect, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// Protected booking routes
router.post('/', protect, authorizeRoles('renter', 'admin'), createBooking);
router.get('/user', protect, getUserBookings);
router.get('/host', protect, authorizeRoles('host', 'admin'), getHostBookings);
router.patch('/:id/status', protect, updateBookingStatus);

export default router;
