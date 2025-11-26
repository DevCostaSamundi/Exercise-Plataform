import express from 'express';
import liveController from '../controllers/live.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/lives/:id/config
 * @desc    Get live configuration
 * @access  Public
 */
router.get('/:id/config', liveController.getLiveConfig);

/**
 * @route   POST /api/v1/lives
 * @desc    Create a new live session
 * @access  Private (Creator)
 */
router.post('/', authenticate, liveController.createLive);

/**
 * @route   PUT /api/v1/lives/:id/config
 * @desc    Update live configuration
 * @access  Private (Creator)
 */
router.put('/:id/config', authenticate, liveController.updateLiveConfig);

export default router;
