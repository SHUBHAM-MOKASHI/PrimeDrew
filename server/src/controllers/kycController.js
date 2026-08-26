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
    const user = await User.findById(req.user._id || req.user.id);
    if (user) {
      if (dlNumber) user.kyc.dlNumber = dlNumber;
      if (expiryDate) user.kyc.dlExpiry = new Date(expiryDate);
      if (name && typeof name === 'string' && name.trim() !== '') {
        user.name = name.trim();
      }
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
      kycStatus: user ? user.kyc.status : 'pending',
      user
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
    const matchPercentage = match_score;
    const isVerified = verified || is_match || matchPercentage >= 50;

    const { fullName, name, dlNumber, idNumber, idType, extractedData } = req.body || {};
    let parsedExtracted = {};
    try {
      parsedExtracted = typeof extractedData === 'string' ? JSON.parse(extractedData || '{}') : (extractedData || {});
    } catch {
      parsedExtracted = {};
    }

    const verifiedName = (req.body.fullName || req.body.name || fullName || name || parsedExtracted?.name || parsedExtracted?.full_name || '').trim();
    const verifiedDocNumber = (idNumber || dlNumber || parsedExtracted?.docNumber || parsedExtracted?.document_number || '').trim();
    const verifiedIdType = (idType || parsedExtracted?.idType || 'Driving License').trim();

    if (isVerified) {
      const updateData = {
        isKycVerified: true,
        kycStatus: 'verified',
        'kyc.status': 'verified',
        'kyc.faceMatchScore': matchPercentage || 100,
        kycConfidenceScore: matchPercentage || 100,
        kycVerifiedAt: new Date(),
        kycDetails: {
          extractedData: {
            ...parsedExtracted,
            name: verifiedName,
            docNumber: verifiedDocNumber,
            idNumber: verifiedDocNumber,
            idType: verifiedIdType
          },
          verifiedAt: new Date(),
          similarityScore: matchPercentage || 100
        }
      };

      if (verifiedDocNumber) {
        updateData['kyc.dlNumber'] = verifiedDocNumber;
      }
      if (verifiedIdType) {
        updateData['kyc.idType'] = verifiedIdType;
      }

      // Explicitly overwrite the user's primary name fields in MongoDB
      if (verifiedName) {
        updateData.name = verifiedName;
        updateData.fullName = verifiedName;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id || req.user.id,
        { $set: updateData },
        { new: true }
      ).select('-password');

      return res.status(200).json({
        success: true,
        message: 'KYC Verified successfully',
        verified: true,
        matchScore: matchPercentage,
        match_score: matchPercentage,
        kycStatus: updatedUser.kycStatus,
        user: updatedUser
      });
    } else {
      const rejectUpdate = {
        isKycVerified: false,
        kycStatus: 'rejected',
        'kyc.status': 'rejected',
        'kyc.faceMatchScore': matchPercentage,
        'kyc.rejectionReason': error || 'Face match score below required threshold (50%)',
        kycConfidenceScore: matchPercentage,
        kycDetails: {
          extractedData: parsedExtracted,
          verifiedAt: new Date(),
          similarityScore: matchPercentage
        }
      };

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id || req.user.id,
        { $set: rejectUpdate },
        { new: true }
      ).select('-password');

      return res.status(400).json({
        success: false,
        message: error || 'Face match score below required threshold (50%)',
        verified: false,
        matchScore: matchPercentage,
        match_score: matchPercentage,
        kycStatus: updatedUser?.kycStatus || 'rejected',
        user: updatedUser
      });
    }
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
    const {
      status = 'verified',
      kycStatus,
      similarityScore,
      faceMatchScore,
      name,
      fullName,
      extractedData,
      dlNumber,
      idNumber,
      idType
    } = req.body;

    const finalStatus = (kycStatus || status || 'verified').toLowerCase();
    const score = similarityScore ?? faceMatchScore ?? 94;
    let parsedExtracted = {};
    try {
      parsedExtracted = typeof extractedData === 'string' ? JSON.parse(extractedData || '{}') : (extractedData || {});
    } catch {
      parsedExtracted = {};
    }

    const verifiedName = (req.body.fullName || req.body.name || fullName || name || parsedExtracted?.name || parsedExtracted?.full_name || '').trim();
    const docNum = (idNumber || dlNumber || parsedExtracted?.docNumber || parsedExtracted?.document_number || '').trim();
    const type = (idType || parsedExtracted?.idType || 'Driving License').trim();

    const updateFields = {
      isKycVerified: finalStatus === 'verified',
      kycStatus: finalStatus,
      'kyc.status': finalStatus,
      'kyc.faceMatchScore': score,
      kycConfidenceScore: score,
      kycVerifiedAt: new Date(),
      'kyc.rejectionReason': finalStatus === 'verified' ? undefined : 'Verification rejected',
      kycDetails: {
        extractedData: {
          ...parsedExtracted,
          name: verifiedName,
          docNumber: docNum,
          idNumber: docNum,
          idType: type
        },
        verifiedAt: new Date(),
        similarityScore: score
      }
    };

    if (verifiedName) {
      updateFields.name = verifiedName;
      updateFields.fullName = verifiedName;
    }

    if (docNum) {
      updateFields['kyc.dlNumber'] = docNum;
    }
    if (type) {
      updateFields['kyc.idType'] = type;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id || req.user._id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `KYC status successfully updated to ${finalStatus}.`,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};
