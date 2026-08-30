import axios from 'axios';

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
    ? 'https://primedrew-api.onrender.com'
    : '');

const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
const API_BASE = API_BASE_URL ? `${API_BASE_URL}/api/v1/inspections` : '/api/v1/inspections';

/**
 * Converts blob: URLs or File references to Base64 Data URLs for backend AI consumption
 */
const ensureDataUrl = async (url) => {
  if (!url) return null;
  if (typeof url === 'string' && (url.startsWith('data:') || url.startsWith('http'))) {
    return url;
  }
  if (typeof url === 'string' && url.startsWith('blob:')) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      });
    } catch {
      return url;
    }
  }
  return url;
};

/**
 * Universal Multi-Vehicle AI Damage Inspection Engine (Cars, Bikes, SUVs)
 * Uses Gemini Vision API on backend with zero dummy coordinates.
 *
 * @param {string} preImageUrl - Baseline Pre-Trip inspection image URL / Blob / Base64
 * @param {string} postImageUrl - Return Post-Trip inspection image URL / Blob / Base64
 * @param {string} [vehicleType='car'] - Vehicle category ('car', 'bike', 'suv')
 * @returns {Promise<{totalDetections: number, newDetections: number, detections: Array, boxes: Array, severity: string}>}
 */
export const analyzeVehicleDamageAI = async (preImageUrl, postImageUrl, vehicleType = 'car') => {
  try {
    // 1. Clean check: If images are identical or no post image, return clean baseline
    if (!postImageUrl || (preImageUrl && preImageUrl === postImageUrl)) {
      return {
        success: true,
        totalDetections: 0,
        newDetections: 0,
        boxes: [],
        detections: [],
        severity: 'None',
        status: 'PRISTINE',
        summaryMessage: 'Vehicle pristine - Clean baseline match. No new damage detected.'
      };
    }

    // Convert local blob URLs to Base64 data URLs for backend delivery
    const [cleanPre, cleanPost] = await Promise.all([
      ensureDataUrl(preImageUrl),
      ensureDataUrl(postImageUrl)
    ]);

    const payload = {
      preImageUrl: cleanPre,
      postImageUrl: cleanPost,
      vehicleType
    };

    // 2. Call Universal Gemini Vision API on Backend using explicit POST
    let response;
    try {
      response = await axios.post(`${API_BASE}/analyze-damage`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000
      });
    } catch (endpointErr) {
      if (endpointErr?.response?.status === 404 || endpointErr?.response?.status === 405) {
        // Fallback to /analyze-universal
        response = await axios.post(`${API_BASE}/analyze-universal`, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000
        });
      } else {
        throw endpointErr;
      }
    }

    const data = response?.data || {};

    if (data.status === 'MANUAL_AUDIT_REQUIRED' || data.requiresManualReview) {
      return {
        success: false,
        status: 'MANUAL_AUDIT_REQUIRED',
        requiresManualReview: true,
        summaryMessage: data.summaryMessage || '⚠️ Vision analysis flagged for manual audit review.',
        message: data.message || 'Automated analysis failed or requires human inspection.',
        totalDetections: 0,
        newDetections: 0,
        boxes: [],
        detections: [],
        severity: 'Review'
      };
    }

    if (Array.isArray(data.boxes)) {
      const boxes = data.boxes
        .filter((b) => (b.confidence > 1 ? b.confidence / 100 : b.confidence) >= 0.80)
        .map((b) => ({
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          xMin: b.x,
          yMin: b.y,
          xMax: Number((b.x + b.width).toFixed(3)),
          yMax: Number((b.y + b.height).toFixed(3)),
          boundingBox: {
            xMin: b.x,
            yMin: b.y,
            xMax: Number((b.x + b.width).toFixed(3)),
            yMax: Number((b.y + b.height).toFixed(3))
          },
          bounding_box: {
            x_min: b.x,
            y_min: b.y,
            x_max: Number((b.x + b.width).toFixed(3)),
            y_max: Number((b.y + b.height).toFixed(3))
          },
          damageType: (b.label || 'scratch').toLowerCase(),
          label: (b.label || 'DAMAGE').toUpperCase(),
          confidence: Number((b.confidence > 1 ? b.confidence / 100 : b.confidence).toFixed(2)),
          location: b.y > 0.65 ? (b.x < 0.5 ? 'Lower Bumper Left' : 'Lower Bumper Right') : 'Exterior Panel',
          isNew: true
        }));

      const isAuthentic = data.isAuthentic ?? true;
      const fraudRisk = data.fraudRisk || 'LOW';
      const fraudReason = data.fraudReason;
      const status = data.status || (boxes.length > 0 ? 'DAMAGED' : 'PRISTINE');
      const summaryMessage =
        data.summaryMessage ||
        (boxes.length > 0
          ? `${boxes.length} new physical damage(s) detected.`
          : 'Vehicle pristine - Clean baseline match. No new damage detected.');
      const severity = boxes.length >= 2 ? 'High' : boxes.length === 1 ? 'Moderate' : 'None';

      return {
        success: data.success ?? true,
        isAuthentic,
        fraudRisk,
        fraudReason,
        status,
        summaryMessage,
        totalDetections: boxes.length,
        newDetections: boxes.length,
        boxes,
        detections: boxes,
        severity
      };
    }

    return {
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
    };
  } catch (err) {
    console.error('[Gemini Vision Error]:', err);
    return {
      success: false,
      status: 'MANUAL_AUDIT_REQUIRED',
      requiresManualReview: true,
      message: err.message,
      totalDetections: 0,
      newDetections: 0,
      boxes: [],
      detections: [],
      severity: 'Review',
      summaryMessage: '⚠️ Automated analysis unavailable. Flagged for manual host review.'
    };
  }
};

export default {
  analyzeVehicleDamageAI
};
