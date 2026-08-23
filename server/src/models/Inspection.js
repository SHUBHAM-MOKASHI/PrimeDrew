import mongoose from 'mongoose';

const boundingBoxSchema = new mongoose.Schema(
  {
    xMin: { type: Number, required: true },
    yMin: { type: Number, required: true },
    xMax: { type: Number, required: true },
    yMax: { type: Number, required: true }
  },
  { _id: false }
);

const detectionSchema = new mongoose.Schema(
  {
    damageType: { type: String, required: true, trim: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    boundingBox: { type: boundingBoxSchema, required: true }
  },
  { _id: false }
);

const inspectionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true
    },
    stage: {
      type: String,
      enum: ['pickup', 'dropoff'],
      required: [true, 'Inspection stage (pickup/dropoff) is required']
    },
    images: {
      type: [String],
      default: []
    },
    detections: {
      type: [detectionSchema],
      default: []
    },
    severity: {
      type: String,
      enum: ['None', 'Moderate', 'High'],
      default: 'None'
    },
    verifiedByHost: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Inspection = mongoose.model('Inspection', inspectionSchema);

export default Inspection;
