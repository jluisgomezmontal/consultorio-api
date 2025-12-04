import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { User } from '../models/index.js';

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Get user from database
    const dbUser = await User.findById(decoded.id)
      .populate('consultoriosIds')
      .lean();

    if (!dbUser) {
      throw new UnauthorizedError('User not found in system');
    }

    // Check if user is active
    if (!dbUser.isActive) {
      throw new UnauthorizedError('Account is deactivated. Please contact the administrator.');
    }

    // Attach user to request
    req.user = {
      id: dbUser._id.toString(),
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      consultoriosIds: (dbUser.consultoriosIds || []).map(c => c?._id?.toString() || c),
      consultorios: dbUser.consultoriosIds || [],
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

/**
 * Check if user has required role(s)
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has access to specific consultorio or is admin
 */
export const checkConsultorioAccess = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { consultorioId } = req.params;

    if (req.user.role === 'admin') {
      return next();
    }

    if (!req.user.consultoriosIds.includes(consultorioId)) {
      throw new ForbiddenError('Access denied to this consultorio');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Add consultorio filter to request for non-admin users
 * This middleware injects consultorio filter automatically based on user's assigned consultorios
 */
export const applyConsultorioFilter = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Admins can see all resources, no filter needed
    if (req.user.role === 'admin') {
      req.consultorioFilter = null;
      return next();
    }

    // For doctors and recepcionistas, filter by their assigned consultorios
    if (req.user.consultoriosIds && req.user.consultoriosIds.length > 0) {
      req.consultorioFilter = { consultorioId: { $in: req.user.consultoriosIds } };
    } else {
      // User has no consultorios assigned, they can't see anything
      req.consultorioFilter = { consultorioId: null };
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize staff (recepcionista, doctor, admin) for operational tasks
 * Use this for endpoints that require staff permissions
 */
export const authorizeStaff = authorize('admin', 'doctor', 'recepcionista');
