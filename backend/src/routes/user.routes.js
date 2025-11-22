import express from 'express';
import userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import validate from '../middleware/validation.middleware.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateEmailSchema,
} from '../validators/user.validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

/**
 * @route   PUT /api/v1/users/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', validate(changePasswordSchema), userController.changePassword);

/**
 * @route   PUT /api/v1/users/email
 * @desc    Update email
 * @access  Private
 */
router.put('/email', validate(updateEmailSchema), userController.updateEmail);

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Delete account
 * @access  Private
 */
router.delete('/account', userController.deleteAccount);

export default router;
