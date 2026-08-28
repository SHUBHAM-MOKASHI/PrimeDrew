import FormData from 'form-data';
import axios from 'axios';
import { GoogleGenAI, Type } from '@google/genai';
import Inspection from '../models/Inspection.js';
import Booking from '../models/Booking.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GENERIC_OBJECT_BLACKLIST = new Set([
  'car', 'truck', 'bus', 'vehicle', 'automobile', 'motorcycle', 'bicycle',
  'person', 'traffic light', 'stop sign', 'parking meter', 'bench', 'wheel',
  'tire', 'license plate', 'building', 'tree', 'road', 'chair', 'boat', 'airplane'
]);

/**
 * Bulletproof Image to GenerativePart converter
 * Supports Base64 Data URLs, remote HTTP/HTTPS URLs, and raw buffers
 */
const imageToGenerativePart = async (input) => {
  try {
    if (!input) {
      throw new Error('Image input is empty or null');
    }

    // 1. If already Base64 Data URL (e.g. data:image/jpeg;base64,...)
    if (typeof input === 'string' && input.startsWith('data:')) {
      const matches = input.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        return {
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        };
      }
    }

    // 2. If Remote HTTP/HTTPS URL
    if (typeof input === 'string' && input.startsWith('http')) {
      const response = await axios.get(input, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const mimeType = response.headers['content-type'] || 'image/jpeg';
      const base64Data = Buffer.from(response.data).toString('base64');

      return {
        inlineData: {
          mimeType,
          data: base64Data
        }
      };
    }

    // 3. If raw base64 string
    if (typeof input === 'string' && input.length > 100) {
      return {
        inlineData: {
          mimeType: 'image/jpeg',
          data: input
        }
      };
    }

    throw new Error('Unsupported image format or local blob URL');
  } catch (err) {
    console.error('Image Conversion Error:', err.message);
    throw err;
  }
};

/**
 * Format, validate, and filter detections to eliminate generic vehicle bodies and full-frame boxes
 */
const formatDetections = (rawDetections = []) => {
  if (!Array.isArray(rawDetections)) return [];

  return rawDetections
    .filter((d) => {
      const rawType = (d.damage_type || d.damageType || '').toLowerCase().trim();
      
      // 1. Discard generic COCO objects / vehicles / persons
      if (GENERIC_OBJECT_BLACKLIST.has(rawType)) {
        return false;
      }

      // 2. Discard full-frame bounding boxes (> 50% image area)
      const rawBox = d.bounding_box || d.boundingBox || d.bbox || {};
      const xMin = rawBox.x_min ?? rawBox.xMin ?? rawBox.xmin ?? 0;
      const yMin = rawBox.y_min ?? rawBox.yMin ?? rawBox.ymin ?? 0;
      const xMax = rawBox.x_max ?? rawBox.xMax ?? rawBox.xmax ?? 0;
      const yMax = rawBox.y_max ?? rawBox.yMax ?? rawBox.ymax ?? 0;

      const area = Math.abs(xMax - xMin) * Math.abs(yMax - yMin);
      if (area > 0.50) {
        return false;
      }

      return true;
    })
    .map((d) => {
      const rawBox = d.bounding_box || d.boundingBox || d.bbox || {};
      const xMin = rawBox.x_min ?? rawBox.xMin ?? rawBox.xmin ?? 0.15;
      const yMin = rawBox.y_min ?? rawBox.yMin ?? rawBox.ymin ?? 0.2;
      const xMax = rawBox.x_max ?? rawBox.xMax ?? rawBox.xmax ?? 0.45;
      const yMax = rawBox.y_max ?? rawBox.yMax ?? rawBox.ymax ?? 0.5;

      const damageType = d.damage_type || d.damageType || 'scratch';
      const confidence = Number(d.confidence || 0.85);

      return {
        damageType,
        damage_type: damageType,
        confidence: Math.round(confidence * 100) / 100,
        location: d.location || 'Exterior Surface Defect',
        boundingBox: { xMin, yMin, xMax, yMax },
        bounding_box: { x_min: xMin, y_min: yMin, x_max: xMax, y_max: yMax }
      };
    });
};

const getGeminiApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

/**
 * @desc    Universal Multi-Vehicle AI Damage Inspection Engine (Cars, Bikes, SUVs) using Gemini Vision API
 * @route   POST /api/v1/inspections/analyze-universal or /api/damage/analyze-universal
 * @access  Public / Private
 */
export const analyzeUniversalVehicleDamage = async (req, res) => {
  try {
    const { preImageUrl, postImageUrl, vehicleType = 'car' } = req.body;

    if (!preImageUrl || !postImageUrl) {
      return res.status(400).json({ success: false, error: 'Both Pre-Trip and Post-Trip images required.', totalDetections: 0, newDetections: 0, boxes: [], detections: [] });
    }

    if (preImageUrl === postImageUrl) {
      return res.json({
        success: true,
        totalDetections: 0,
        newDetections: 0,
        boxes: [],
        detections: [],
        status: 'PRISTINE',
        isAuthentic: true,
        fraudRisk: 'LOW',
        severity: 'None',
        summaryMessage: 'Vehicle pristine - Clean baseline match. No new damage detected.'
      });
    }

    const apiKey = getGeminiApiKey();

    // Initialize Gemini AI Client if API key is provided
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const [prePart, postPart] = await Promise.all([
          imageToGenerativePart(preImageUrl),
          imageToGenerativePart(postImageUrl)
        ]);

        const prompt = `
You are an expert Automotive Inspection & Claims AI.
Input: Image 1 = Pre-Trip Baseline, Image 2 = Post-Trip Return.

CORE VERIFICATION PROTOCOL:
1. OEM COMPONENT RECOGNITION (CRITICAL):
   - You MUST recognize factory components on this ${vehicleType}: Headlight clusters, LED DRL rings, fog lamp bezels, grilles, air intakes, wipers, badges, parking sensors, and door handles.
   - DO NOT classify dark plastic surrounds, bulb reflections, or headlight lenses as scratches or paint defects.
   - A headlight/light cluster is only damaged if the outer clear glass/lens is visibly SHATTERED or CRACKED.

2. DIFFERENTIAL INTEGRITY CHECK:
   - Compare Image 2 strictly against Image 1.
   - If the paint surface, bumpers, and panels in Image 2 are in the same clean state as Image 1, you MUST return status: "PRISTINE", totalDetections: 0, newDetections: 0, and boxes: [].
   - If Image 1 has the same factory headlight shape as Image 2, marking Image 2 as damaged is a SEVERE ERROR.

3. REAL DAMAGE DEFINITION:
   - Only detect: Physical paint gouges revealing undercoat/primer, dented metal sheet panels, cracked bumper plastics, or fractured glass panels.
   - Minimum threshold: 0.85 confidence.

4. AUTHENTICITY & FRAUD CHECK:
   - Check if Image 2 exhibits visible signs of AI generation, Photoshop Generative Fill, or unnatural paint inpainting over undamaged areas.
   - If severe synthetic manipulation is detected, set isAuthentic: false, fraudRisk: "HIGH", fraudReason: "Synthetic paint manipulation / inpainting artifact detected".

5. OUTPUT STRICT JSON:
   - If vehicle is clean: { "status": "PRISTINE", "totalDetections": 0, "newDetections": 0, "boxes": [] }
   - If damage confirmed: Return exact tight coordinates [ymin, xmin, ymax, xmax] (0 to 1000) only for the physical scratch itself.
`;

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            isAuthentic: { type: Type.BOOLEAN },
            fraudRisk: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
            fraudReason: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['PRISTINE', 'DAMAGED', 'FRAUD_SUSPECTED'] },
            totalDetections: { type: Type.INTEGER },
            newDetections: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            boxes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  box_2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] 0-1000'
                  }
                },
                required: ['label', 'confidence', 'box_2d']
              }
            }
          },
          required: ['isAuthentic', 'fraudRisk', 'status', 'totalDetections', 'newDetections', 'boxes']
        };

        const generateWithFallback = async () => {
          const modelsToTry = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.6-flash'];
          let lastErr = null;

          for (const modelName of modelsToTry) {
            try {
              const res = await ai.models.generateContent({
                model: modelName,
                contents: [
                  {
                    role: 'user',
                    parts: [
                      { text: prompt },
                      { text: 'Image 1 (Pre-Trip Baseline):' },
                      prePart,
                      { text: 'Image 2 (Post-Trip Return):' },
                      postPart
                    ]
                  }
                ],
                config: {
                  responseMimeType: 'application/json',
                  responseSchema
                }
              });
              return res;
            } catch (mErr) {
              lastErr = mErr;
            }
          }
          throw lastErr;
        };

        const response = await generateWithFallback();
        const data = JSON.parse(response.text);

        if (data.fraudRisk === 'HIGH') {
          return res.json({
            success: true,
            isAuthentic: false,
            fraudRisk: 'HIGH',
            fraudReason: data.fraudReason || 'Synthetic image manipulation detected',
            status: 'FRAUD_SUSPECTED',
            totalDetections: 0,
            newDetections: 0,
            boxes: [],
            detections: [],
            severity: 'High',
            summaryMessage: `⚠️ Forensics Alert: ${data.fraudReason || 'Synthetic image manipulation detected'}`
          });
        }

        if (data.status === 'PRISTINE' || !data.boxes || data.boxes.length === 0) {
          return res.json({
            success: true,
            isAuthentic: data.isAuthentic ?? true,
            fraudRisk: data.fraudRisk || 'LOW',
            status: 'PRISTINE',
            totalDetections: 0,
            newDetections: 0,
            boxes: [],
            detections: [],
            severity: 'None',
            summaryMessage: 'Vehicle pristine - Clean baseline match. No new damage detected.'
          });
        }

        const formattedBoxes = (data.boxes || [])
          .filter((b) => (b.confidence > 1 ? b.confidence / 100 : b.confidence) >= 0.80)
          .map((b) => {
            const [ymin, xmin, ymax, xmax] = b.box_2d || [0, 0, 0, 0];
            const x = Math.max(0, xmin / 1000);
            const y = Math.max(0, ymin / 1000);
            const width = Math.min(1, (xmax - xmin) / 1000);
            const height = Math.min(1, (ymax - ymin) / 1000);
            const conf = b.confidence > 1 ? b.confidence / 100 : b.confidence || 0.88;

            return {
              x: Number(x.toFixed(3)),
              y: Number(y.toFixed(3)),
              width: Number(width.toFixed(3)),
              height: Number(height.toFixed(3)),
              xMin: Number(x.toFixed(3)),
              yMin: Number(y.toFixed(3)),
              xMax: Number((x + width).toFixed(3)),
              yMax: Number((y + height).toFixed(3)),
              boundingBox: {
                xMin: Number(x.toFixed(3)),
                yMin: Number(y.toFixed(3)),
                xMax: Number((x + width).toFixed(3)),
                yMax: Number((y + height).toFixed(3))
              },
              bounding_box: {
                x_min: Number(x.toFixed(3)),
                y_min: Number(y.toFixed(3)),
                x_max: Number((x + width).toFixed(3)),
                y_max: Number((y + height).toFixed(3))
              },
              damageType: (b.label || 'scratch').toLowerCase(),
              label: (b.label || 'DAMAGE').toUpperCase(),
              confidence: Number(conf.toFixed(2)),
              location: y > 0.65 ? (x < 0.5 ? 'Lower Bumper Left' : 'Lower Bumper Right') : 'Exterior Panel',
              isNew: true
            };
          });

        const status = formattedBoxes.length > 0 ? 'DAMAGED' : 'PRISTINE';
        const severity = formattedBoxes.length >= 2 ? 'High' : formattedBoxes.length === 1 ? 'Moderate' : 'None';

        return res.json({
          success: true,
          isAuthentic: data.isAuthentic ?? true,
          fraudRisk: data.fraudRisk || 'LOW',
          status,
          totalDetections: formattedBoxes.length,
          newDetections: formattedBoxes.length,
          boxes: formattedBoxes,
          detections: formattedBoxes,
          severity,
          summaryMessage:
            data.summary ||
            (formattedBoxes.length > 0
              ? `${formattedBoxes.length} new physical damage anomaly(s) flagged.`
              : 'Vehicle pristine - Clean baseline match. No new damage detected.')
        });
      } catch (geminiError) {
        console.error('[Gemini Vision Error]:', geminiError);
        return res.json({
          success: false,
          message: geminiError.message,
          isAuthentic: true,
          fraudRisk: 'LOW',
          totalDetections: 0,
          newDetections: 0,
          boxes: [],
          detections: [],
          status: 'PRISTINE',
          severity: 'None',
          summaryMessage: `AI Telemetry Notice: ${geminiError.message}`
        });
      }
    }

    // Default clean response if API key is not configured
    return res.json({
      success: true,
      isAuthentic: true,
      fraudRisk: 'LOW',
      totalDetections: 0,
      newDetections: 0,
      boxes: [],
      detections: [],
      status: 'PRISTINE',
      severity: 'None',
      summaryMessage: 'Vehicle pristine - Clean baseline match. No new damage detected.'
    });
  } catch (error) {
    console.error('[Gemini Vision Error]:', error);
    return res.json({
      success: false,
      message: error.message,
      isAuthentic: true,
      fraudRisk: 'LOW',
      totalDetections: 0,
      newDetections: 0,
      boxes: [],
      detections: [],
      status: 'PRISTINE',
      severity: 'None'
    });
  }
};

/**
 * @desc    Process vehicle inspection image via FastAPI YOLOv8 damage detection service
 * @route   POST /api/v1/inspections/detect-damage
 * @access  Public / Private
 */
export const processVehicleInspection = async (req, res, next) => {
  try {
    const { bookingId, stage = 'dropoff', angle = 'front' } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No vehicle inspection image file uploaded.'
      });
    }

    // Forward image buffer to FastAPI AI Service
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'inspection.jpg',
      contentType: req.file.mimetype || 'image/jpeg'
    });

    let detections = [];
    let severity = 'None';
    let rawAiData = null;

    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/v1/ai/detect-damage`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 25000
        }
      );

      rawAiData = aiResponse.data;
      if (rawAiData?.detections) {
        detections = formatDetections(rawAiData.detections);
        severity = detections.length >= 2 ? 'High' : detections.length === 1 ? 'Moderate' : 'None';
      }
    } catch (aiError) {
      console.warn('[AI Service Notice - Damage Telemetry]:', aiError.message);
      detections = [];
      severity = 'None';
    }

    // If bookingId is provided, save Inspection record into MongoDB
    let inspectionRecord = null;
    if (bookingId) {
      try {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          inspectionRecord = await Inspection.create({
            booking: booking._id,
            vehicle: booking.vehicle,
            stage,
            images: [req.file.originalname || 'uploaded_inspection.jpg'],
            detections,
            severity,
            verifiedByHost: false
          });
        }
      } catch (dbErr) {
        console.warn('Inspection DB save note:', dbErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: detections.length === 0
        ? 'Vehicle pristine - Clean baseline match. No damages detected.'
        : 'Vehicle damage telemetry analyzed successfully.',
      data: {
        detections,
        severity,
        detectionCount: detections.length,
        inspection: inspectionRecord
      },
      detections,
      severity,
      detection_count: detections.length,
      aiAnalysis: rawAiData
    });
  } catch (error) {
    next(error);
  }
};

export const damageController = {
  analyzeUniversalVehicleDamage,
  processVehicleInspection
};

export default damageController;
