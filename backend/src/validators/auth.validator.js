import Joi from 'joi';

/**
 * Register validation schema
 */
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username must contain only letters and numbers',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 30 characters',
    'any.required': 'Username is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords must match',
    'any.required': 'Password confirmation is required',
  }),
  displayName: Joi.string().max(100).required().messages({
    'string.max': 'Display name cannot exceed 100 characters',
    'any.required': 'Display name is required',
  }),
  birthDate: Joi.date().max('now').required().custom((value, helpers) => {
    const age = Math.floor((new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      return helpers.error('any.invalid');
    }
    return value;
  }).messages({
    'date.base': 'Please provide a valid birth date',
    'date.max': 'Birth date cannot be in the future',
    'any.required': 'Birth date is required',
    'any.invalid': 'You must be at least 18 years old',
  }),
  genderIdentity: Joi.string().valid(
    'Cis homem',
    'Cis mulher',
    'Trans homem',
    'Trans mulher',
    'Não-binário',
    'Queer',
    'Gênero fluido',
    'Prefiro não dizer'
  ).required().messages({
    'any.only': 'Please select a valid gender identity',
    'any.required': 'Gender identity is required',
  }),
  orientation: Joi.string().valid(
    'Gay',
    'Lésbica',
    'Bissexual',
    'Pansexual',
    'Assexual',
    'Queer',
    'Prefiro não dizer'
  ).required().messages({
    'any.only': 'Please select a valid orientation',
    'any.required': 'Orientation is required',
  }),
  agreeTerms: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must agree to the terms and conditions',
    'any.required': 'You must agree to the terms and conditions',
  }),
  ageConfirm: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must confirm that you are 18 years or older',
    'any.required': 'You must confirm that you are 18 years or older',
  }),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
});

/**
 * Login validation schema
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords must match',
    'any.required': 'Password confirmation is required',
  }),
});

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});
