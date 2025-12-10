import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  toggleLike,
  checkLiked,
} from '../controllers/like.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/posts/:postId/like
 * @desc    Toggle like on a post
 * @access  Private
 */
router.post('/posts/:postId/like', toggleLike);

/**
 * @route   GET /api/v1/posts/:postId/liked
 * @desc    Check if user liked a post
 * @access  Private
 */
router.get('/posts/:postId/liked', checkLiked);

export default router;
