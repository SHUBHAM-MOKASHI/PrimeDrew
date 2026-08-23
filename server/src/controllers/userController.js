import User from '../models/User.js';

/**
 * @desc    Update user KYC verification status in database
 * @route   PATCH /api/v1/users/kyc-status
 * @access  Private
 */
export const updateKycStatus = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { status = 'verified', similarityScore, extractedData } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        kycStatus: status,
        'kyc.status': status,
        'kyc.faceMatchScore': similarityScore || 94,
        kycDetails: {
          extractedData: extractedData || {},
          verifiedAt: new Date(),
          similarityScore: similarityScore || 94
        }
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'KYC status updated successfully to verified.',
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.roles?.[0] || 'renter',
        roles: updatedUser.roles,
        kycStatus: updatedUser.kycStatus,
        kyc: updatedUser.kyc,
        kycDetails: updatedUser.kycDetails
      }
    });
  } catch (error) {
    next(error);
  }
};
