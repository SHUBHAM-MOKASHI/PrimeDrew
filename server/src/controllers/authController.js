import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const MASTER_ADMIN_PHONE = '7387861807';

export const isMasterAdminPhone = (phone) => {
  if (!phone) return false;
  const cleanNumber = String(phone).replace(/\D/g, '').slice(-10);
  return cleanNumber === MASTER_ADMIN_PHONE;
};

/**
 * Generate JWT Token helper
 */
const generateToken = (userId, role = 'renter') => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_smart_p2p_vehicle_rental_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId, role }, secret, { expiresIn });
};

/**
 * Send token in response (and optional HTTP-only cookie)
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  const userRole = user.role || user.roles?.[0] || 'USER';
  const token = generateToken(user._id, userRole);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;

  const kycStatus = userObj.kycStatus || userObj.kyc?.status || 'pending';
  const isKycVerified = userObj.isKycVerified || kycStatus === 'verified';
  userObj.id = user._id;
  userObj._id = user._id;
  userObj.role = userRole;
  userObj.kycStatus = kycStatus;
  userObj.isKycVerified = isKycVerified;
  userObj.hostApplicationStatus = userObj.hostApplicationStatus || 'NONE';
  userObj.hostApplicationDetails = userObj.hostApplicationDetails || {};
  userObj.kyc = {
    ...(userObj.kyc || {}),
    status: kycStatus
  };

  res
    .status(statusCode)
    .cookie('jwt', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        fullName: user.fullName || user.name,
        email: user.email,
        phone: user.phone,
        role: userRole,
        roles: user.roles || [userRole],
        hostApplicationStatus: userObj.hostApplicationStatus,
        hostApplicationDetails: userObj.hostApplicationDetails,
        isKycVerified: isKycVerified,
        kycStatus: kycStatus,
        kycConfidenceScore: userObj.kycConfidenceScore,
        kycVerifiedAt: userObj.kycVerifiedAt,
        kyc: userObj.kyc,
        kycDetails: userObj.kycDetails
      }
    });
};

/**
 * @desc    Register a new user (Renter / Host / Admin)
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.'
      });
    }

    let existingUser = await User.findOne({ phone: phone.trim() });
    if (existingUser) {
      return sendTokenResponse(existingUser, 200, res, 'User logged in successfully');
    }

    const assignedRole = isMasterAdminPhone(phone) ? 'ADMIN' : (role || 'USER');
    const user = await User.create({
      name: name || `User ${phone.slice(-4)}`,
      email: email ? email.toLowerCase() : `${phone.replace(/\D/g, '')}@primedrew.com`,
      phone: phone.trim(),
      password: password || 'P2P_AUTH_PASS',
      role: assignedRole,
      roles: assignedRole === 'ADMIN' ? ['ADMIN', 'HOST', 'USER'] : [assignedRole],
      hostApplicationStatus: assignedRole === 'ADMIN' ? 'APPROVED' : 'NONE',
      kycStatus: assignedRole === 'ADMIN' ? 'verified' : 'pending',
      isKycVerified: assignedRole === 'ADMIN'
    });

    sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    let query = {};
    if (phone) query = { phone: phone.trim() };
    else if (email) query = { email: email.toLowerCase() };
    else {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number or email address.'
      });
    }

    const user = await User.findOne(query).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials.'
        });
      }
    }

    if (isMasterAdminPhone(user.phone) && user.role !== 'ADMIN') {
      user.role = 'ADMIN';
      user.roles = ['ADMIN', 'HOST', 'USER'];
      user.hostApplicationStatus = 'APPROVED';
      user.isKycVerified = true;
      user.kycStatus = 'verified';
      await user.save();
    }

    const freshUser = await User.findById(user._id);
    sendTokenResponse(freshUser, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Phone OTP & login/register user in real MongoDB
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res, next) => {
  try {
    const { phone, role = 'USER' } = req.body;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.'
      });
    }

    const cleanPhone = phone.trim();
    const isMaster = isMasterAdminPhone(cleanPhone);
    let user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      user = await User.create({
        phone: cleanPhone,
        role: isMaster ? 'ADMIN' : (role || 'USER'),
        roles: isMaster ? ['ADMIN', 'HOST', 'USER'] : [role || 'USER'],
        hostApplicationStatus: isMaster ? 'APPROVED' : 'NONE',
        kycStatus: isMaster ? 'verified' : 'pending',
        isKycVerified: isMaster,
        kyc: { status: isMaster ? 'verified' : 'pending' }
      });
    } else if (isMaster && user.role !== 'ADMIN') {
      user.role = 'ADMIN';
      user.roles = ['ADMIN', 'HOST', 'USER'];
      user.hostApplicationStatus = 'APPROVED';
      user.isKycVerified = true;
      user.kycStatus = 'verified';
      await user.save();
    }

    sendTokenResponse(user, 200, res, 'Phone OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Directly update user KYC status
 * @route   PATCH /api/v1/auth/kyc-status OR POST /api/v1/auth/kyc-status
 * @access  Private
 */
export const updateAuthKycStatus = async (req, res, next) => {
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

    const updateData = {
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
      updateData['kyc.dlNumber'] = docNum;
    }
    if (type) {
      updateData['kyc.idType'] = type;
    }

    if (verifiedName) {
      updateData.name = verifiedName;
      updateData.fullName = verifiedName;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
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
      message: 'KYC status updated to verified.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user profile & KYC state
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    // Auto-promote Master Admin phone number if needed
    if (isMasterAdminPhone(user.phone) && user.role !== 'ADMIN') {
      user.role = 'ADMIN';
      user.roles = ['ADMIN', 'HOST', 'USER'];
      user.hostApplicationStatus = 'APPROVED';
      user.isKycVerified = true;
      user.kycStatus = 'verified';
      await user.save();
    }

    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;

    const kycStatus = userObj.kycStatus || userObj.kyc?.status || 'pending';
    const isKycVerified = userObj.isKycVerified || kycStatus === 'verified';
    userObj.id = user._id;
    userObj._id = user._id;
    userObj.role = user.role || user.roles?.[0] || 'USER';
    userObj.kycStatus = kycStatus;
    userObj.isKycVerified = isKycVerified;
    userObj.fullName = userObj.fullName || userObj.name;
    userObj.hostApplicationStatus = userObj.hostApplicationStatus || 'NONE';
    userObj.hostApplicationDetails = userObj.hostApplicationDetails || {};
    userObj.kyc = {
      ...(userObj.kyc || {}),
      status: kycStatus
    };

    res.status(200).json({
      success: true,
      user: userObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user / clear auth cookie
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = async (req, res, next) => {
  try {
    res.cookie('jwt', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
