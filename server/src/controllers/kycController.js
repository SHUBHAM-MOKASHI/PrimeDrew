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

    const { match_score = 0, is_match = false, verified = false, error = '' } = aiResponse.data;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const isVerified = verified || is_match || match_score >= 50;

    user.kycStatus = isVerified ? 'verified' : 'rejected';
    user.kyc = {
      ...(user.kyc || {}),
      status: user.kycStatus,
      faceMatchScore: match_score,
      rejectionReason: isVerified ? undefined : (error || 'Biometric match score below threshold.')
    };

    if (isVerified) {
      user.kycDetails = {
        extractedData: {},
        verifiedAt: new Date(),
        similarityScore: match_score
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isVerified 
        ? 'Biometric verification passed! KYC status set to verified.' 
        : 'Biometric verification failed.',
      verified: isVerified,
      kycStatus: user.kycStatus,
      match_score,
      error: isVerified ? null : error
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Directly update user KYC verification status in database
 * @route   PATCH /api/v1/users/kyc-status OR PATCH /api/v1/kyc/status
 * @access  Private
 */
export const updateKYCStatus = async (req, res, next) => {
  try {
    const { status = 'verified', similarityScore, faceMatchScore, extractedData, dlNumber } = req.body;
    const score = similarityScore ?? faceMatchScore ?? 94;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    user.kycStatus = status;
    user.kycDetails = {
      extractedData: extractedData || {},
      verifiedAt: new Date(),
      similarityScore: score
    };
    user.kyc = {
      ...(user.kyc || {}),
      status: status,
      dlNumber: dlNumber || extractedData?.docNumber || user.kyc?.dlNumber,
      faceMatchScore: score,
      rejectionReason: status === 'verified' ? undefined : user.kyc?.rejectionReason
    };

    await user.save();

    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: `KYC status successfully updated to ${status}.`,
      user: userObj
    });
  } catch (error) {
    next(error);
  }
};
