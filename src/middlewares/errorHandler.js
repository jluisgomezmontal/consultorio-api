import { ApiError } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = null;

  // Handle known API errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err.errors) {
      errors = err.errors;
    }
  }
  // Handle Prisma errors
  else if (err.code) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = `Duplicate value for ${err.meta?.target || 'field'}`;
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid foreign key reference';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
    }
  }
  // Handle Zod validation errors
  else if (err.name === 'ZodError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error
  console.error('❌ Error completo:', err);
  console.error('Stack trace:', err.stack);
  
  logger.error(message, {
    statusCode,
    stack: err.stack,
    url: req.url,
    method: req.method,
    errorDetails: err.message,
  });

  // Send error response
  return errorResponse(res, message, statusCode, errors);
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundHandler = (req, res) => {
  return errorResponse(res, 'Route not found', 404);
};
