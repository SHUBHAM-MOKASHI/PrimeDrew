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
      enum: [
        'requested',
        'confirmed',
        'active',
        'completed',
        'disputed',
        'cancelled',
        'CONFIRMED',
        'HANDOVER_PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED'
      ],
      default: 'CONFIRMED'
    },
    handoverOtp: {
      type: String
    },
    handoverOtpExpiresAt: {
      type: Date
    },
    tripStartTime: {
      type: Date
    },
    tripEndTime: {
      type: Date
    },
    actualStartTime: {
      type: Date
    },
    actualEndTime: {
      type: Date
    },
    vehicleLastKnownLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date
    },

    // =========================================================================
    // Manual Audit, Escrow Hold & Dispute Resolution Subsystem
    // =========================================================================
    inspectionStatus: {
      type: String,
      enum: ['PENDING', 'PASSED_PRISTINE', 'DAMAGE_DETECTED', 'MANUAL_AUDIT_REQUIRED'],
      default: 'PENDING'
    },
    escrowStatus: {
      type: String,
      enum: ['HELD', 'RELEASED_TO_RENTER', 'TRANSFERRED_TO_HOST', 'DISPUTED'],
      default: 'HELD'
    },
    securityDepositAmount: {
      type: Number,
      default: 5000
    },
    preImageUrl: {
      type: String,
      default: null
    },
    postImageUrl: {
      type: String,
      default: null
    },
    detections: [
      {
        label: { type: String, required: true },
        confidence: { type: Number, required: true },
        box: {
          ymin: { type: Number, required: true },
          xmin: { type: Number, required: true },
          ymax: { type: Number, required: true },
          xmax: { type: Number, required: true }
        }
      }
    ],
    dispute: {
      isDisputed: {
        type: Boolean,
        default: false
      },
      disputedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      renterReason: {
        type: String,
        trim: true
      },
      hostDecision: {
        type: String,
        enum: ['PENDING', 'ACCEPTED_DAMAGE', 'DISMISSED_DIRT_GLARE', 'RESOLVED_SPLIT'],
        default: 'PENDING'
      },
      disputeDeadline: {
        type: Date
      },
      resolvedAt: {
        type: Date
      }
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
