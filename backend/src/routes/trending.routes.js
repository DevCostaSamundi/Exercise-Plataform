import express from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';
import {
  getTrendingPosts,
  getTrendingCreators,
  getTrendingTags,
} from '../controllers/trending.controller.js';

const router = express.Router();

/**
 * @route   GET /api/v1/trending/posts
 * @desc    Get trending posts
 * @access  Public (optionalAuth for personalization)
 */
router.get('/posts', optionalAuth, getTrendingPosts);

/**
 * @route   GET /api/v1/trending/creators
 * @desc    Get trending creators
 * @access  Public (optionalAuth for personalization)
 */
router.get('/creators', optionalAuth, getTrendingCreators);

/**
 * @route   GET /api/v1/trending/tags
 * @desc    Get trending tags/hashtags
 * @access  Public (optionalAuth for personalization)
 */
router.get('/tags', optionalAuth, getTrendingTags);

export default router;
