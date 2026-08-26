import jwt from 'jsonwebtoken';
import User, { isMasterAdminPhone } from '../models/User.js';

/**
 * Middleware to authenticate requests via JWT (Bearer token or Cookie)
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_smart_p2p_vehicle_rental_2026';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
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

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.'
      });
    }
    next(error);
  }
};

/**
 * Middleware to authorize access based on user roles
 * @param  {...string} roles Permitted roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. User role context missing.'
      });
    }

    if (isMasterAdminPhone(req.user.phone)) {
      return next();
    }

    const normalizedUserRoles = (req.user.roles || []).map((r) => r.toUpperCase());
    const normalizedAllowed = roles.map((r) => r.toUpperCase());
    const hasRole = normalizedUserRoles.some((role) => normalizedAllowed.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.roles.join(', ')}' is not authorized to perform this action.`
      });
    }

    next();
  };
};

/**
 * Middleware restricted strictly to Master Admin (Phone 7387861807 or ADMIN role)
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const isMaster = isMasterAdminPhone(req.user.phone);
  const isAdminRole = req.user.role === 'ADMIN' || req.user.role === 'admin' || req.user.roles?.includes('ADMIN') || req.user.roles?.includes('admin');

  if (!isMaster && !isAdminRole) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Master Admin privileges required. Restricted to phone 7387861807.'
    });
  }

  next();
};
