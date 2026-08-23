import FormData from 'form-data';
import axios from 'axios';
import User from '../models/User.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @desc    Process DL / RC ID document extraction via EasyOCR microservice
 * @route   POST /api/v1/kyc/extract-id
 * @access  Private
 */
export const processIDExtraction = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No ID document image file uploaded.'
      });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'document.jpg',
      contentType: req.file.mimetype || 'image/jpeg'
    });

    let aiResponse;
    try {
      aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/v1/ai/extract-id`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 30000
        }
      );
    } catch (aiError) {
      console.error('[AI Proxy Error - ID Extraction]:', aiError.response?.data || aiError.message);
      return res.status(502).json({
        success: false,
        message: 'Failed to communicate with AI OCR document extraction microservice.',
        error: aiError.response?.data?.detail || aiError.message
      });
    }

    const { dlNumber, expiryDate, name, documentType, rawText } = aiResponse.data;

    // Update current user's KYC draft fields in DB
    const user = await User.findById(req.user._id);
    if (user) {
      if (dlNumber) user.kyc.dlNumber = dlNumber;
      if (expiryDate) user.kyc.dlExpiry = new Date(expiryDate);
      if (user.kyc.status === 'unverified') {
        user.kyc.status = 'pending';
      }
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'ID document metadata extracted successfully.',
      data: {
        documentType,
        dlNumber,
        name,
        expiryDate,
        rawText
      },
      kycStatus: user ? user.kyc.status : 'pending'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process 1:1 Biometric Face Verification (ID Photo vs Live Selfie)
 * @route   POST /api/v1/kyc/verify-face
 * @access  Private
 */
export const processFaceVerification = async (req, res, next) => {
  try {
    // Multer upload.fields exposes files in req.files
    const idCardFile = req.files?.id_card?.[0] || req.files?.idCard?.[0];
    const selfieFile = req.files?.selfie?.[0];

    if (!idCardFile || !selfieFile) {
      return res.status(400).json({
        success: false,
        message: 'Both id_card and selfie image files are required for face verification.'
      });
    }

    const formData = new FormData();
    formData.append('id_card', idCardFile.buffer, {
      filename: idCardFile.originalname || 'id_card.jpg',
      contentType: idCardFile.mimetype || 'image/jpeg'
    });
    formData.append('selfie', selfieFile.buffer, {
      filename: selfieFile.originalname || 'selfie.jpg',
      contentType: selfieFile.mimetype || 'image/jpeg'
    });

    let aiResponse;
    try {
      aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/v1/ai/verify-face`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 30000
        }
      );
    } catch (aiError) {
      console.error('[AI Proxy Error - Face Verification]:', aiError.response?.data || aiError.message);
      return res.status(502).json({
        success: false,
        message: 'Failed to communicate with AI biometric face verification microservice.',
        error: aiError.response?.data?.detail || aiError.message
      });
    }

    const { faceMatchScore = 0, isMatch = false, confidence = 0, message = '' } = aiResponse.data;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    user.kyc.faceMatchScore = faceMatchScore;

    // Threshold check: Must be >= 80% to set status to 'verified'
    if (faceMatchScore >= 80) {
      user.kyc.status = 'verified';
      user.kyc.rejectionReason = undefined;
    } else {
      user.kyc.status = 'rejected';
      user.kyc.rejectionReason = `Biometric match score is below required 80% threshold (${faceMatchScore}%).`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: faceMatchScore >= 80 
        ? 'Biometric verification passed! KYC status set to verified.' 
        : 'Biometric verification failed. Score below threshold.',
      kycStatus: user.kyc.status,
      faceMatchScore,
      isMatch,
      confidence,
      details: message
    });
  } catch (error) {
    next(error);
  }
};
