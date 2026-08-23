import mongoose from 'mongoose';

const pricingBreakdownSchema = new mongoose.Schema(
  {
    baseFare: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    pricingBreakdown: {
      type: pricingBreakdownSchema,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'escrow_locked', 'settled', 'refunded'],
      default: 'pending'
    },
    tripStatus: {
      type: String,
      enum: ['requested', 'confirmed', 'active', 'completed', 'disputed', 'cancelled'],
      default: 'requested'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to speed up availability queries and prevent double-booking collisions
bookingSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ vehicle: 1, tripStatus: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
