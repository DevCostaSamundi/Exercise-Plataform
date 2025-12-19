import { ValidationError } from '../utils/errors.js';

/**
 * Middleware to validate request body against Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {

      console.log('❌ Validation errors:', JSON.stringify(error.details, null, 2));
      console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError('Validation failed', errors));
    }

    // Replace request body with validated and sanitized value
    req.body = value;
    next();
  };
};

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError('Query validation failed', errors));
    }

    req.query = value;
    next();
  };
};

/**
 * Middleware to validate URL parameters
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError('Parameter validation failed', errors));
    }

    req.params = value;
    next();
  };
};

export default validate;
