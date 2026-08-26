import User from '../models/User.js';

/**
 * @desc    Update user KYC verification status in database
 * @route   PATCH /api/v1/users/kyc-status
 * @access  Private
 */
export const updateKycStatus = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
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

    if (docNum) {
      updateFields['kyc.dlNumber'] = docNum;
    }
    if (type) {
      updateFields['kyc.idType'] = type;
    }

    if (verifiedName) {
      updateFields.name = verifiedName;
      updateFields.fullName = verifiedName;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
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
      message: 'KYC status updated successfully to verified.',
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        fullName: updatedUser.fullName || updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role || updatedUser.roles?.[0] || 'USER',
        roles: updatedUser.roles,
        hostApplicationStatus: updatedUser.hostApplicationStatus || 'NONE',
        hostApplicationDetails: updatedUser.hostApplicationDetails || {},
        isKycVerified: updatedUser.isKycVerified,
        kycStatus: updatedUser.kycStatus,
        kycConfidenceScore: updatedUser.kycConfidenceScore,
        kycVerifiedAt: updatedUser.kycVerifiedAt,
        kyc: updatedUser.kyc,
        kycDetails: updatedUser.kycDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit application to become a verified Host
 * @route   POST /api/v1/users/apply-host
 * @access  Private
 */
export const applyHostApplication = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { dlNumber, rcNumber, city, experienceYears, vehicleTypePreference, notes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (user.role === 'ADMIN' || user.hostApplicationStatus === 'APPROVED') {
      return res.status(200).json({
        success: true,
        message: 'You are already an approved Host / Master Admin.',
        user
      });
    }

    const applicationDetails = {
      dlNumber: dlNumber || user.kyc?.dlNumber || user.kycDetails?.extractedData?.docNumber || '',
      rcNumber: rcNumber || '',
      city: city || 'Mumbai',
      experienceYears: Number(experienceYears) || 1,
      vehicleTypePreference: vehicleTypePreference || 'Cars & EVs',
      notes: notes || '',
      appliedAt: new Date()
    };

    user.hostApplicationStatus = 'PENDING';
    user.hostApplicationDetails = applicationDetails;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Host application submitted successfully. It will be reviewed by the Master Admin.',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's host application status
 * @route   GET /api/v1/users/host-status
 * @access  Private
 */
export const getHostApplicationStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      role: user.role,
      hostApplicationStatus: user.hostApplicationStatus || 'NONE',
      hostApplicationDetails: user.hostApplicationDetails || {}
    });
  } catch (error) {
    next(error);
  }
};
