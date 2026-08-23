import FormData from 'form-data';
import axios from 'axios';
import Inspection from '../models/Inspection.js';
import Booking from '../models/Booking.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @desc    Process vehicle inspection image via FastAPI YOLOv8 damage detection service
 * @route   POST /api/v1/inspections/detect-damage
 * @access  Private
 */
export const processVehicleInspection = async (req, res, next) => {
  try {
    const { bookingId, stage } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No vehicle inspection image file uploaded.'
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId is required.'
      });
    }

    if (!stage || !['pickup', 'dropoff'].includes(stage)) {
      return res.status(400).json({
        success: false,
        message: "stage is required and must be either 'pickup' or 'dropoff'."
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Associated booking not found.'
      });
    }

    // Forward image buffer to FastAPI AI Service
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'inspection.jpg',
      contentType: req.file.mimetype || 'image/jpeg'
    });

    let aiResponse;
    try {
      aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/v1/ai/detect-damage`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 30000 // 30 seconds timeout for AI model inference
        }
      );
    } catch (aiError) {
      console.error('[AI Proxy Error - Damage Detection]:', aiError.response?.data || aiError.message);
      return res.status(502).json({
        success: false,
        message: 'Failed to communicate with AI damage detection microservice.',
        error: aiError.response?.data?.detail || aiError.message
      });
    }

    const { detections = [], severity = 'None' } = aiResponse.data;

    // Create & save Inspection document in MongoDB
    const inspection = await Inspection.create({
      booking: booking._id,
      vehicle: booking.vehicle,
      stage,
      images: [req.file.originalname || 'uploaded_inspection_image.jpg'],
      detections,
      severity,
      verifiedByHost: false
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle inspection processed and damage analysis saved successfully.',
      data: inspection,
      aiAnalysis: aiResponse.data
    });
  } catch (error) {
    next(error);
  }
};
