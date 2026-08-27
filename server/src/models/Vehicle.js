import mongoose from 'mongoose';

const vehicleSpecsSchema = new mongoose.Schema(
  {
    transmission: { type: String, enum: ['Manual', 'Automatic'], default: 'Automatic' },
    fuelType: { type: String, enum: ['Petrol', 'Diesel', 'EV', 'Hybrid'], default: 'Petrol' },
    seats: { type: Number, default: 5 },
    mileageKm: { type: Number, default: 0 }
  },
  { _id: false }
);

const vehiclePricingSchema = new mongoose.Schema(
  {
    baseHourlyRate: { type: Number, required: true, min: 0 },
    baseDailyRate: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, required: true, min: 0, default: 2000 }
  },
  { _id: false }
);

const vehicleLocationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: { type: String, trim: true }
  },
  { _id: false }
);

const vehicleDocumentsSchema = new mongoose.Schema(
  {
    rcFrontUrl: { type: String, trim: true },
    rcBackUrl: { type: String, trim: true },
    insuranceUrl: { type: String, trim: true }
  },
  { _id: false }
);

const rcDocumentSchema = new mongoose.Schema(
  {
    rcNumber: { type: String, required: true, trim: true },
    documentUrl: { type: String, required: true, trim: true },
    extractedName: { type: String, trim: true },
    nameMatchScore: { type: Number, default: 100 },
    isFlaggedForReview: { type: Boolean, default: false },
    flagReason: { type: String, trim: true },
    isVerifiedByAdmin: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
);

const vehicleSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Vehicle title is required'],
      trim: true
    },
    make: {
      type: String,
      required: [true, 'Make is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Year is required']
    },
    category: {
      type: String,
      enum: ['Hatchback', 'Sedan', 'SUV', 'EV', 'Bike', 'Luxury'],
      required: [true, 'Category is required']
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      uppercase: true,
      trim: true
    },
    plateNumber: {
      type: String,
      uppercase: true,
      trim: true
    },
    specs: {
      type: vehicleSpecsSchema,
      required: true
    },
    pricing: {
      type: vehiclePricingSchema,
      required: true
    },
    location: {
      type: vehicleLocationSchema,
      required: true
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 1;
        },
        message: 'At least 1 vehicle photo is required.'
      }
    },
    rcDocument: {
      type: rcDocumentSchema,
      required: true
    },
    documents: {
      type: vehicleDocumentsSchema,
      default: () => ({})
    },
    status: {
      type: String,
      enum: ['available', 'rented', 'maintenance', 'unlisted'],
      default: 'available'
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Add 2dsphere index for location queries
vehicleSchema.index({ location: '2dsphere' });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
