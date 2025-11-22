import express from 'express';
import creatorController from '../controllers/creator.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/creators
 * @desc    Get all creators
 * @access  Public
 */
router.get('/', creatorController.getCreators);

/**
 * @route   GET /api/v1/creators/:id
 * @desc    Get creator by ID
 * @access  Public
 */
router.get('/:id', creatorController.getCreatorById);

/**
 * @route   POST /api/v1/creators
 * @desc    Become a creator
 * @access  Private
 */
router.post('/', authenticate, creatorController.becomeCreator);

/**
 * @route   PUT /api/v1/creators/:id
 * @desc    Update creator profile
 * @access  Private (Creator/Admin)
 */
router.put('/:id', authenticate, creatorController.updateCreator);

/**
 * @route   GET /api/v1/creators/:id/stats
 * @desc    Get creator statistics
 * @access  Private (Creator/Admin)
 */
router.get('/:id/stats', authenticate, creatorController.getCreatorStats);

export default router;
