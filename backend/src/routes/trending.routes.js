import express from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';
import {
  getTrendingPosts,
  getTrendingCreators,
  getTrendingTags,
} from '../controllers/trending.controller.js';

const router = express.Router();

// GET /api/v1/trending/posts - Posts em alta
router.get('/posts', optionalAuth, getTrendingPosts);

// GET /api/v1/trending/creators - Criadores em alta
router.get('/creators', optionalAuth, getTrendingCreators);

// GET /api/v1/trending/tags - Tags em alta
router.get('/tags', optionalAuth, getTrendingTags);

export default router;