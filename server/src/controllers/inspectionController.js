import FormData from 'form-data';
import axios from 'axios';
import { GoogleGenAI, Type } from '@google/genai';
import Inspection from '../models/Inspection.js';
import Booking from '../models/Booking.js';
import { detectDamageWithGemini } from '../services/geminiAiService.js';

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
      const rawType = (d.damage_type || d.damageType || d.label || '').toLowerCase().trim();
      
      // 1. Discard generic COCO objects / vehicles / persons
      if (GENERIC_OBJECT_BLACKLIST.has(rawType)) {
        return false;
      }

      // 2. Normalize bounding box coordinates to 0.0 - 1.0 before area validation
      const rawBox = d.bounding_box || d.boundingBox || d.bbox || d.box_2d || {};
      let xmin = rawBox.x_min ?? rawBox.xMin ?? rawBox.xmin ?? rawBox[1] ?? 0;
      let ymin = rawBox.y_min ?? rawBox.yMin ?? rawBox.ymin ?? rawBox[0] ?? 0;
      let xmax = rawBox.x_max ?? rawBox.xMax ?? rawBox.xmax ?? rawBox[3] ?? 0;
      let ymax = rawBox.y_max ?? rawBox.yMax ?? rawBox.ymax ?? rawBox[2] ?? 0;

      // Convert 0-1000 scale coordinates to normalized 0.0 - 1.0
      if (xmax > 1.05 || ymax > 1.05 || xmin > 1.05 || ymin > 1.05) {
        xmin /= 1000;
        ymin /= 1000;
        xmax /= 1000;
        ymax /= 1000;
      }

      const width = Math.abs(xmax - xmin);
      const height = Math.abs(ymax - ymin);
      const area = width * height;

      // Discard boxes where dimensions are inverted or area exceeds 0.50 (50% of image) or too small (< 0.001)
      if (width <= 0 || height <= 0 || area > 0.50 || area < 0.001) {
        return false;
      }

      const conf = d.confidence > 1 ? d.confidence / 100 : (d.confidence ?? 0.85);
      if (conf < 0.80) {
        return false;
      }

      return true;
    })
    .map((d) => {
      const rawBox = d.bounding_box || d.boundingBox || d.bbox || d.box_2d || {};
      let xmin = rawBox.x_min ?? rawBox.xMin ?? rawBox.xmin ?? rawBox[1] ?? 0.15;
      let ymin = rawBox.y_min ?? rawBox.yMin ?? rawBox.ymin ?? rawBox[0] ?? 0.2;
      let xmax = rawBox.x_max ?? rawBox.xMax ?? rawBox.xmax ?? rawBox[3] ?? 0.45;
      let ymax = rawBox.y_max ?? rawBox.yMax ?? rawBox.ymax ?? rawBox[2] ?? 0.5;

      if (xmax > 1.05 || ymax > 1.05 || xmin > 1.05 || ymin > 1.05) {
        xmin /= 1000;
        ymin /= 1000;
        xmax /= 1000;
        ymax /= 1000;
      }

      const xMin = Number(Math.min(xmin, xmax).toFixed(3));
      const yMin = Number(Math.min(ymin, ymax).toFixed(3));
      const xMax = Number(Math.max(xmin, xmax).toFixed(3));
      const yMax = Number(Math.max(ymin, ymax).toFixed(3));
      const width = Number((xMax - xMin).toFixed(3));
      const height = Number((yMax - yMin).toFixed(3));

      const damageType = d.damage_type || d.damageType || d.label || 'scratch';
      const conf = d.confidence > 1 ? d.confidence / 100 : (d.confidence ?? 0.85);

      return {
        damageType: damageType.toLowerCase(),
        damage_type: damageType.toLowerCase(),
        label: damageType.toUpperCase(),
        confidence: Number(conf.toFixed(2)),
        location: yMin > 0.65 ? (xMin < 0.5 ? 'Lower Bumper Left' : 'Lower Bumper Right') : 'Exterior Panel',
        x: xMin,
        y: yMin,
        width,
        height,
        xMin,
        yMin,
        xMax,
        yMax,
        boundingBox: { xMin, yMin, xMax, yMax },
        bounding_box: { x_min: xMin, y_min: yMin, x_max: xMax, y_max: yMax },
        isNew: true
      };
    });
};

const getGeminiApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

/**
 * Helper: Updates Booking with escrow, inspection status, detections, and 24-hr dispute deadline
 */
const updateBookingEscrowState = async (bookingId, {
  inspectionStatus,
  escrowStatus,
  detections = [],
  preImageUrl = null,
  postImageUrl = null
}) => {
  if (!bookingId) return null;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return null;

    if (inspectionStatus) booking.inspectionStatus = inspectionStatus;
    if (escrowStatus) booking.escrowStatus = escrowStatus;
    if (preImageUrl) booking.preImageUrl = preImageUrl;
    if (postImageUrl) booking.postImageUrl = postImageUrl;

    if (Array.isArray(detections)) {
      booking.detections = detections.map((d) => {
        const rawBox = d.box || d.boundingBox || d.bounding_box || {};
        return {
          label: (d.label || d.damageType || 'SCRATCH').toUpperCase(),
          confidence: d.confidence > 1 ? Number((d.confidence / 100).toFixed(2)) : Number((d.confidence ?? 0.85).toFixed(2)),
          box: {
            ymin: Number((rawBox.ymin ?? rawBox.y_min ?? rawBox.yMin ?? d.yMin ?? d.y ?? 0).toFixed(3)),
            xmin: Number((rawBox.xmin ?? rawBox.x_min ?? rawBox.xMin ?? d.xMin ?? d.x ?? 0).toFixed(3)),
            ymax: Number((rawBox.ymax ?? rawBox.y_max ?? rawBox.yMax ?? d.yMax ?? 0).toFixed(3)),
            xmax: Number((rawBox.xmax ?? rawBox.x_max ?? rawBox.xMax ?? d.xMax ?? 0).toFixed(3))
          }
        };
      });
    }

    if (inspectionStatus === 'DAMAGE_DETECTED' || inspectionStatus === 'MANUAL_AUDIT_REQUIRED') {
      if (!booking.dispute) booking.dispute = {};
      // Set 24-hour contest deadline
      booking.dispute.disputeDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    await booking.save();
    return booking;
  } catch (err) {
    console.error('[Escrow State Update Error]:', err.message);
    return null;
  }
};

/**
 * @desc    Universal Multi-Vehicle AI Damage Inspection Engine (Cars, Bikes, SUVs) using Gemini Vision API
 * @route   POST /api/v1/inspections/analyze-universal or /api/v1/inspections/analyze-damage
 * @access  Public / Private
 */
export const analyzeUniversalVehicleDamage = async (req, res) => {
  const { bookingId, preImageUrl, postImageUrl, vehicleType = 'car' } = req.body || {};

  try {
    if (!preImageUrl || !postImageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Both Pre-Trip and Post-Trip images required.',
        status: 'INVALID_INPUT',
        totalDetections: 0,
        newDetections: 0,
        boxes: [],
        detections: []
      });
    }

    // 1. Identical Baseline Check
    if (preImageUrl === postImageUrl) {
      await updateBookingEscrowState(bookingId, {
        inspectionStatus: 'PASSED_PRISTINE',
        escrowStatus: 'RELEASED_TO_RENTER',
        detections: [],
        preImageUrl,
        postImageUrl
      });

      return res.json({
        success: true,
        totalDetections: 0,
        newDetections: 0,
        boxes: [],
        detections: [],
        status: 'PASSED_PRISTINE',
        inspectionStatus: 'PASSED_PRISTINE',
        escrowStatus: 'RELEASED_TO_RENTER',
        securityDepositAmount: 5000,
        isAuthentic: true,
        fraudRisk: 'LOW',
        severity: 'None',
        summaryMessage: 'Vehicle pristine - Clean baseline match. Security deposit released.'
      });
    }

    const apiKey = getGeminiApiKey();

    // 2. Gemini AI Inspection Execution
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const [prePart, postPart] = await Promise.all([
          imageToGenerativePart(preImageUrl),
          imageToGenerativePart(postImageUrl)
        ]);

        const prompt = `
You are an expert Certified Automotive Insurance AI Damage and Forensics Evaluator.
Input: Image 1 = Pre-Trip Baseline, Image 2 = Post-Trip Return.

CORE VERIFICATION PROTOCOL:
1. STRICT DIFFERENTIAL DAMAGE ISOLATION:
   - Compare Image 2 strictly against Image 1.
   - Ignore surface dirt, dust, mud specks, water droplets, rain spots, reflections, and ambient lighting/shadow variations.
   - Isolate ONLY structural paint gouges revealing undercoat/primer, deep metal dents, cracked bumper plastics, broken glass, or body panel tears present strictly in Image 2 but absent in Image 1.
   - If Image 2 has no new physical structural damage compared to Image 1, you MUST return status: "PRISTINE", totalDetections: 0, newDetections: 0, and boxes: [].

2. OEM COMPONENT RECOGNITION (CRITICAL):
   - Recognize all factory OEM components on this ${vehicleType}: Headlamp assemblies, projector lenses, LED DRL borders, fog lamp bezels, grilles, air dam intakes, wipers, badges, parking sensors, roof rails, and door handles.
   - NEVER classify dark plastic trim, bulb reflections, headlamp cutouts, or glass outlines as scratches.
   - A lighting assembly is damaged ONLY if the outer clear glass/lens is visibly SHATTERED, CRACKED, or MISSING.

3. CONFIDENCE & BOUNDING BOX PRECISION:
   - Minimum confidence threshold: 0.80. Any detection below 0.80 MUST be discarded.
   - Return tight normalized coordinates [ymin, xmin, ymax, xmax] scaled 0 to 1000 tightly framing the defect itself (excluding clean panels, pavement, wheels, and lights).

4. AUTHENTICITY & FRAUD CHECK:
   - Check if Image 2 exhibits visible signs of AI generation, Photoshop Generative Fill, or synthetic inpainting over damaged areas.
   - If severe synthetic manipulation is detected, set isAuthentic: false, fraudRisk: "HIGH", fraudReason: "Synthetic paint manipulation / inpainting artifact detected".

5. OUTPUT STRICT JSON:
   - If vehicle is clean: { "status": "PRISTINE", "totalDetections": 0, "newDetections": 0, "boxes": [] }
   - If damage confirmed: { "status": "DAMAGED", "totalDetections": N, "newDetections": N, "boxes": [...] }
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
          const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
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
        let data = {};
        try {
          data = JSON.parse(response.text);
        } catch (jsonErr) {
          throw new Error(`Unparseable JSON from vision model: ${jsonErr.message}`);
        }

        // Fraud detected check
        if (data.fraudRisk === 'HIGH') {
          await updateBookingEscrowState(bookingId, {
            inspectionStatus: 'MANUAL_AUDIT_REQUIRED',
            escrowStatus: 'HELD',
            detections: [],
            preImageUrl,
            postImageUrl
          });

          return res.json({
            success: true,
            isAuthentic: false,
            fraudRisk: 'HIGH',
            fraudReason: data.fraudReason || 'Synthetic image manipulation detected',
            status: 'MANUAL_AUDIT_REQUIRED',
            inspectionStatus: 'MANUAL_AUDIT_REQUIRED',
            escrowStatus: 'HELD',
            securityDepositAmount: 5000,
            disputeDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            totalDetections: 0,
            newDetections: 0,
            boxes: [],
            detections: [],
            severity: 'High',
            requiresManualReview: true,
            summaryMessage: `⚠️ Forensics Alert: ${data.fraudReason || 'Synthetic image manipulation detected'}. Escrow held for manual review.`
          });
        }

        // Pristine check (Zero damage)
        if (data.status === 'PRISTINE' || !data.boxes || data.boxes.length === 0) {
          await updateBookingEscrowState(bookingId, {
            inspectionStatus: 'PASSED_PRISTINE',
            escrowStatus: 'RELEASED_TO_RENTER',
            detections: [],
            preImageUrl,
            postImageUrl
          });

          return res.json({
            success: true,
            isAuthentic: data.isAuthentic ?? true,
            fraudRisk: data.fraudRisk || 'LOW',
            status: 'PASSED_PRISTINE',
            inspectionStatus: 'PASSED_PRISTINE',
            escrowStatus: 'RELEASED_TO_RENTER',
            securityDepositAmount: 5000,
            totalDetections: 0,
            newDetections: 0,
            boxes: [],
            detections: [],
            severity: 'None',
            summaryMessage: 'Vehicle pristine - Clean baseline match. Security deposit released to renter.'
          });
        }

        // Format damage detections
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
              box: {
                ymin: Number(y.toFixed(3)),
                xmin: Number(x.toFixed(3)),
                ymax: Number((y + height).toFixed(3)),
                xmax: Number((x + width).toFixed(3))
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

        if (formattedBoxes.length === 0) {
          await updateBookingEscrowState(bookingId, {
            inspectionStatus: 'PASSED_PRISTINE',
            escrowStatus: 'RELEASED_TO_RENTER',
            detections: [],
            preImageUrl,
            postImageUrl
          });

          return res.json({
            success: true,
            isAuthentic: true,
            fraudRisk: 'LOW',
            status: 'PASSED_PRISTINE',
            inspectionStatus: 'PASSED_PRISTINE',
            escrowStatus: 'RELEASED_TO_RENTER',
            securityDepositAmount: 5000,
            totalDetections: 0,
            newDetections: 0,
            boxes: [],
            detections: [],
            severity: 'None',
            summaryMessage: 'Vehicle pristine - Clean baseline match. Security deposit released.'
          });
        }

        // Damage Confirmed
        const status = 'DAMAGE_DETECTED';
        const severity = formattedBoxes.length >= 2 ? 'High' : 'Moderate';
        const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await updateBookingEscrowState(bookingId, {
          inspectionStatus: 'DAMAGE_DETECTED',
          escrowStatus: 'HELD',
          detections: formattedBoxes,
          preImageUrl,
          postImageUrl
        });

        return res.json({
          success: true,
          isAuthentic: data.isAuthentic ?? true,
          fraudRisk: data.fraudRisk || 'LOW',
          status: 'DAMAGE_DETECTED',
          inspectionStatus: 'DAMAGE_DETECTED',
          escrowStatus: 'HELD',
          securityDepositAmount: 5000,
          disputeDeadline: deadline,
          totalDetections: formattedBoxes.length,
          newDetections: formattedBoxes.length,
          boxes: formattedBoxes,
          detections: formattedBoxes,
          severity,
          summaryMessage: `${formattedBoxes.length} physical damage defect(s) detected. Security deposit locked in Escrow pending 24-hr review.`
        });
      } catch (geminiError) {
        console.error('[Gemini Vision Error - Escrow Held for Audit]:', geminiError.message);

        const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await updateBookingEscrowState(bookingId, {
          inspectionStatus: 'MANUAL_AUDIT_REQUIRED',
          escrowStatus: 'HELD',
          detections: [],
          preImageUrl,
          postImageUrl
        });

        return res.json({
          success: true,
          status: 'MANUAL_AUDIT_REQUIRED',
          inspectionStatus: 'MANUAL_AUDIT_REQUIRED',
          escrowStatus: 'HELD',
          securityDepositAmount: 5000,
          message: 'Vision model uncertainty/failure. Escrow held for manual review.',
          summaryMessage: '⚠️ Vision model uncertainty. Security deposit locked in Escrow for manual audit.',
          disputeDeadline: deadline,
          isAuthentic: true,
          fraudRisk: 'LOW',
          totalDetections: 0,
          newDetections: 0,
          boxes: [],
          detections: [],
          requiresManualReview: true,
          severity: 'Review'
        });
      }
    }

    // Default if API key not configured -> Flag for manual audit & hold escrow
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await updateBookingEscrowState(bookingId, {
      inspectionStatus: 'MANUAL_AUDIT_REQUIRED',
      escrowStatus: 'HELD',
      detections: [],
      preImageUrl,
      postImageUrl
    });

    return res.json({
      success: true,
      status: 'MANUAL_AUDIT_REQUIRED',
      inspectionStatus: 'MANUAL_AUDIT_REQUIRED',
      escrowStatus: 'HELD',
      securityDepositAmount: 5000,
      message: 'Vision model uncertainty/failure. Escrow held for manual review.',
      summaryMessage: '⚠️ Vision model unconfigured. Escrow held for manual review.',
      disputeDeadline: deadline,
      isAuthentic: true,
      fraudRisk: 'LOW',
      totalDetections: 0,
      newDetections: 0,
      boxes: [],
      detections: [],
      requiresManualReview: true,
      severity: 'Review'
    });
  } catch (error) {
    console.error('[Damage Inspection Exception]:', error.message);
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await updateBookingEscrowState(bookingId, {
      inspectionStatus: 'MANUAL_AUDIT_REQUIRED',
      escrowStatus: 'HELD',
      detections: [],
      preImageUrl,
      postImageUrl
    });

    return res.json({
      success: true,
      status: 'MANUAL_AUDIT_REQUIRED',
      inspectionStatus: 'MANUAL_AUDIT_REQUIRED',
      escrowStatus: 'HELD',
      securityDepositAmount: 5000,
      message: 'Vision model uncertainty/failure. Escrow held for manual review.',
      summaryMessage: `⚠️ Manual Review Required: ${error.message}`,
      disputeDeadline: deadline,
      isAuthentic: true,
      fraudRisk: 'LOW',
      totalDetections: 0,
      newDetections: 0,
      boxes: [],
      detections: [],
      requiresManualReview: true,
      severity: 'Review'
    });
  }
};

/**
 * @desc    File a dispute on an inspection verdict within 24 hours (Renter action)
 * @route   POST /api/v1/inspections/:bookingId/dispute
 * @access  Private (Renter / User)
 */
export const fileDispute = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { reason = 'Renter contested automated AI damage verdict.' } = req.body || {};

    const booking = await Booking.findById(bookingId).populate('renter host vehicle');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking record not found.'
      });
    }

    // Enforce 24-hour contest deadline
    const deadline = booking.dispute?.disputeDeadline;
    if (deadline && new Date() > new Date(deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Dispute window has closed. Contests must be submitted within 24 hours of inspection completion.'
      });
    }

    if (!booking.dispute) {
      booking.dispute = {};
    }

    booking.dispute.isDisputed = true;
    booking.dispute.disputedBy = req.user?._id || req.user?.id || booking.renter?._id;
    booking.dispute.renterReason = reason;
    booking.dispute.hostDecision = 'PENDING';
    booking.escrowStatus = 'DISPUTED';

    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Dispute filed successfully. Security deposit is locked in DISPUTED escrow state.',
      escrowStatus: booking.escrowStatus,
      booking
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Resolve a damage dispute / audit (Host action)
 * @route   POST /api/v1/inspections/:bookingId/resolve-host
 * @access  Private (Host / Admin)
 */
export const resolveDisputeHost = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { decision } = req.body || {};

    const validDecisions = ['DISMISSED_DIRT_GLARE', 'ACCEPTED_DAMAGE', 'RESOLVED_SPLIT'];
    if (!decision || !validDecisions.includes(decision)) {
      return res.status(400).json({
        success: false,
        message: `Invalid host decision. Must be one of: ${validDecisions.join(', ')}`
      });
    }

    const booking = await Booking.findById(bookingId).populate('renter host vehicle');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking record not found.'
      });
    }

    if (!booking.dispute) {
      booking.dispute = {};
    }

    booking.dispute.hostDecision = decision;
    booking.dispute.resolvedAt = new Date();

    if (decision === 'DISMISSED_DIRT_GLARE') {
      // Host dismissed as dirt / normal wear -> refund security deposit to renter
      booking.escrowStatus = 'RELEASED_TO_RENTER';
      booking.inspectionStatus = 'PASSED_PRISTINE';
    } else if (decision === 'ACCEPTED_DAMAGE') {
      // Host confirmed real damage -> security deposit transferred to host
      booking.escrowStatus = 'TRANSFERRED_TO_HOST';
      booking.inspectionStatus = 'DAMAGE_DETECTED';
    } else if (decision === 'RESOLVED_SPLIT') {
      booking.escrowStatus = 'RELEASED_TO_RENTER';
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Dispute resolved as ${decision}. Escrow updated to ${booking.escrowStatus}.`,
      escrowStatus: booking.escrowStatus,
      inspectionStatus: booking.inspectionStatus,
      booking
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get booking audit, escrow state, images, and detections for side-by-side review
 * @route   GET /api/v1/inspections/:bookingId/audit
 * @access  Public / Private
 */
export const getBookingAudit = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate('renter host vehicle');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking record not found for audit.'
      });
    }

    let preImageUrl = booking.preImageUrl;
    let postImageUrl = booking.postImageUrl;

    // Fallback: look up in Inspection collection if not directly stored on Booking
    if (!preImageUrl || !postImageUrl) {
      const inspections = await Inspection.find({ booking: bookingId }).sort({ createdAt: 1 });
      const pickupInsp = inspections.find((i) => i.stage === 'pickup');
      const dropoffInsp = inspections.find((i) => i.stage === 'dropoff');

      if (!preImageUrl && pickupInsp?.images?.[0]) {
        preImageUrl = pickupInsp.images[0];
      }
      if (!postImageUrl && dropoffInsp?.images?.[0]) {
        postImageUrl = dropoffInsp.images[0];
      }
    }

    return res.status(200).json({
      success: true,
      booking: {
        ...booking.toObject(),
        preImageUrl: preImageUrl || null,
        postImageUrl: postImageUrl || null
      }
    });
  } catch (err) {
    next(err);
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

    // 100% JavaScript Gemini Vision Damage Detection
    let detections = [];
    let severity = 'None';
    let rawAiData = null;

    try {
      const geminiResult = await detectDamageWithGemini(
        req.file.buffer,
        req.file.mimetype || 'image/jpeg'
      );
      detections = formatDetections(geminiResult.detections);
      severity = geminiResult.severity || (detections.length >= 2 ? 'High' : detections.length === 1 ? 'Moderate' : 'None');
      rawAiData = geminiResult;
    } catch (aiError) {
      console.warn('[Gemini Damage Detection Notice]:', aiError.message);
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
