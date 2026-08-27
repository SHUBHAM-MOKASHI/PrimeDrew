import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import { redisAcquireLock, redisDel } from '../config/redis.js';

/**
 * @desc    Create a new vehicle booking with concurrency locking & multi-doc transaction
 * @route   POST /api/v1/bookings
 * @access  Private (Renter)
 */
export const createBooking = async (req, res, next) => {
  const { vehicleId, startDate, endDate } = req.body;

  // 1. User KYC verification check
  if (req.user.kyc?.status !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'KYC Verification Required. User KYC status must be verified before booking a vehicle.'
    });
  }

  // 2. Validate input dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid startDate or endDate format.'
    });
  }

  if (start >= end) {
    return res.status(400).json({
      success: false,
      message: 'End date must be strictly after start date.'
    });
  }

  if (start < new Date(now.getTime() - 5 * 60 * 1000)) { // allow 5 mins grace for clock drift
    return res.status(400).json({
      success: false,
      message: 'Start date cannot be in the past.'
    });
  }

  // 3. Acquire Redis lock for anti-double-booking race conditions
  const lockKey = `booking:lock:${vehicleId}:${start.getTime()}-${end.getTime()}`;
  const isLocked = await redisAcquireLock(lockKey, 10); // 10 seconds TTL

  if (!isLocked) {
    return res.status(409).json({
      success: false,
      message: 'Another booking transaction is currently processing for this vehicle. Please try again.'
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 4. Validate Vehicle status
    const vehicle = await Vehicle.findById(vehicleId).session(session);
    if (!vehicle) {
      await session.abortTransaction();
      await redisDel(lockKey);
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.'
      });
    }

    if (vehicle.status !== 'available' || vehicle.verificationStatus !== 'approved') {
      await session.abortTransaction();
      await redisDel(lockKey);
      return res.status(400).json({
        success: false,
        message: 'Vehicle is currently unavailable for booking or unapproved.'
      });
    }

    // Prevent Host from booking their own vehicle
    if (vehicle.host.toString() === req.user._id.toString()) {
      await session.abortTransaction();
      await redisDel(lockKey);
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own listed vehicle.'
      });
    }

    // 5. Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      vehicle: vehicleId,
      tripStatus: { $in: ['requested', 'confirmed', 'active'] },
      $or: [
        { startDate: { $lt: end }, endDate: { $gt: start } }
      ]
    }).session(session);

    if (overlappingBooking) {
      await session.abortTransaction();
      await redisDel(lockKey);
      return res.status(409).json({
        success: false,
        message: 'Vehicle is already booked for the selected date range.'
      });
    }

    // 6. Dynamic Pricing Calculation Breakdown
    const diffMs = Math.abs(end - start);
    const durationHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const durationDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let baseFare = 0;
    if (durationHours < 24) {
      baseFare = vehicle.pricing.baseHourlyRate * durationHours;
    } else {
      baseFare = vehicle.pricing.baseDailyRate * durationDays;
    }

    const securityDeposit = vehicle.pricing.securityDeposit || 2000;
    const platformFee = Math.round(baseFare * 0.10); // 10% platform fee
    const totalAmount = baseFare + securityDeposit + platformFee;

    // 7. Create booking inside transaction
    const [booking] = await Booking.create(
      [
        {
          renter: req.user._id,
          host: vehicle.host,
          vehicle: vehicle._id,
          startDate: start,
          endDate: end,
          pricingBreakdown: {
            baseFare,
            securityDeposit,
            platformFee,
            totalAmount
          },
          paymentStatus: 'pending',
          tripStatus: 'requested'
        }
      ],
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Booking request created successfully.',
      data: booking
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    session.endSession();
    await redisDel(lockKey);
  }
};

/**
 * @desc    Get bookings for logged-in renter
 * @route   GET /api/v1/bookings/user
 * @access  Private (Renter)
 */
export const getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ renter: req.user._id })
      .populate('vehicle')
      .populate('host', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get incoming booking requests for host's fleet
 * @route   GET /api/v1/bookings/host
 * @access  Private (Host, Admin)
 */
export const getHostBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ host: req.user._id })
      .populate('vehicle')
      .populate('renter', 'name email phone kyc.status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update booking trip status (Approve, Cancel, Complete, Dispute)
 * @route   PATCH /api/v1/bookings/:id/status
 * @access  Private (Renter, Host, Admin)
 */
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['confirmed', 'active', 'completed', 'disputed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    const isRenter = booking.renter.toString() === req.user._id.toString();
    const isHost = booking.host.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (!isRenter && !isHost && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to modify this booking.'
      });
    }

    // Permission checks for specific status transitions
    if (status === 'confirmed' && !isHost && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the host or admin can approve/confirm a booking.'
      });
    }

    if (status === 'cancelled' && !isRenter && !isHost && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only renter, host, or admin can cancel a booking.'
      });
    }

    booking.tripStatus = status;

    // Update payment status accordingly
    if (status === 'confirmed') {
      booking.paymentStatus = 'escrow_locked';
    } else if (status === 'completed') {
      booking.paymentStatus = 'settled';
    } else if (status === 'cancelled') {
      booking.paymentStatus = 'refunded';
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking trip status updated to '${status}'.`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate a secure 6-digit Handover OTP for vehicle collection
 * @route   POST /api/v1/bookings/:id/generate-handover-otp
 * @access  Private (Renter, Host, Admin)
 */
export const generateHandoverOtp = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('vehicle');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    const isRenter = booking.renter.toString() === req.user._id.toString();
    const isHost = booking.host.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN' || req.user.roles?.includes('ADMIN') || req.user.roles?.includes('admin');

    if (!isRenter && !isHost && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized for this booking handover.'
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity

    booking.handoverOtp = otp;
    booking.handoverOtpExpiresAt = expiresAt;
    booking.tripStatus = 'HANDOVER_PENDING';
    if (!booking.tripStartTime) {
      booking.tripStartTime = booking.startDate;
    }
    if (!booking.tripEndTime) {
      booking.tripEndTime = booking.endDate;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle Handover OTP generated successfully (Valid for 15 minutes).',
      handoverOtp: otp,
      handoverOtpExpiresAt: expiresAt,
      tripStatus: booking.tripStatus,
      booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Handover OTP by Host to unlock vehicle and start live trip timer
 * @route   POST /api/v1/bookings/:id/verify-handover-otp
 * @access  Private (Host, Admin, or authorized Renter)
 */
export const verifyHandoverOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the 6-digit handover OTP.'
      });
    }

    const booking = await Booking.findById(req.params.id).populate('vehicle');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Check OTP match
    if (!booking.handoverOtp || booking.handoverOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Handover OTP. Please verify the 6-digit code shown on the renter screen.'
      });
    }

    // Check Expiration
    if (booking.handoverOtpExpiresAt && new Date() > new Date(booking.handoverOtpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Handover OTP has expired. Please regenerate a new 6-digit code.'
      });
    }

    // OTP Validated: Transition trip state to IN_PROGRESS and start timer
    booking.tripStatus = 'IN_PROGRESS';
    booking.actualStartTime = new Date();
    booking.paymentStatus = 'escrow_locked';
    booking.handoverOtp = undefined;
    booking.handoverOtpExpiresAt = undefined;

    // Update vehicle status
    if (booking.vehicle) {
      await Vehicle.findByIdAndUpdate(booking.vehicle._id || booking.vehicle, {
        status: 'rented'
      });
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle Handover Verified! Live trip started.',
      actualStartTime: booking.actualStartTime,
      tripStatus: booking.tripStatus,
      booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete trip, stop timer, and settle booking
 * @route   POST /api/v1/bookings/:id/complete-trip
 * @access  Private (Host, Renter, Admin)
 */
export const completeTrip = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('vehicle');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    booking.tripStatus = 'COMPLETED';
    booking.actualEndTime = new Date();
    booking.paymentStatus = 'settled';

    if (booking.vehicle) {
      await Vehicle.findByIdAndUpdate(booking.vehicle._id || booking.vehicle, {
        status: 'available'
      });
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Trip completed successfully! Escrow settled.',
      actualEndTime: booking.actualEndTime,
      tripStatus: booking.tripStatus,
      booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vehicle real-time GPS telemetry location during active trip
 * @route   PATCH /api/v1/bookings/:id/location
 * @access  Private
 */
export const updateTripLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and Longitude are required.'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        vehicleLastKnownLocation: {
          lat: Number(lat),
          lng: Number(lng),
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    res.status(200).json({
      success: true,
      location: booking.vehicleLastKnownLocation
    });
  } catch (error) {
    next(error);
  }
};

