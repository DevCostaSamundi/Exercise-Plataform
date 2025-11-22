import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

/**
 * Global error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  // Log error
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  // Set default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle specific error types
  if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    
    // Unique constraint violation
    if (err.code === 'P2002') {
      message = `Duplicate field value: ${err.meta?.target}`;
    }
    
    // Foreign key constraint violation
    if (err.code === 'P2003') {
      message = 'Invalid reference to related resource';
    }
    
    // Record not found
    if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  }

  // Handle Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }
  }

  // Send error response
  const response = {
    status: 'error',
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorMiddleware;
