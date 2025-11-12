import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import prisma from '../config/database.js';

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

    // Verify Supabase token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    console.log({user})
    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        consultorio: true,
      },
    });

    if (!dbUser) {
      throw new UnauthorizedError('User not found in system');
    }

    // Attach user to request
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      consultorioId: dbUser.consultorioId,
      consultorio: dbUser.consultorio,
    };

    next();
  } catch (error) {
    next(error);
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
 * Check if user belongs to the same consultorio or is admin
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

    if (req.user.consultorioId !== consultorioId) {
      throw new ForbiddenError('Access denied to this consultorio');
    }

    next();
  } catch (error) {
    next(error);
  }
};
