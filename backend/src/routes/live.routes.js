import express from 'express';
import rateLimit from 'express-rate-limit';
import liveController from '../controllers/live.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rate limiter for live creation
const liveCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 live sessions per 15 minutes
  message: 'Too many live session creation requests, please try again later.',
});

// Rate limiter for live config updates
const liveConfigLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: 'Too many live config update requests, please try again later.',
});

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
router.post('/', authenticate, liveCreateLimiter, liveController.createLive);

/**
 * @route   PUT /api/v1/lives/:id/config
 * @desc    Update live configuration
 * @access  Private (Creator)
 */
router.put('/:id/config', authenticate, liveConfigLimiter, liveController.updateLiveConfig);

export default router;
