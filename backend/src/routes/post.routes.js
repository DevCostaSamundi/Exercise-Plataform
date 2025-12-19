import express from 'express';
import postController from '../controllers/post.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import validate from '../middleware/validation.middleware.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import {
  createPostSchema,
  updatePostSchema,
  getPostsQuerySchema,
} from '../validators/post.validator.js';

const router = express.Router();

/**
 * @route   GET /api/v1/posts
 * @desc    Get all posts
 * @access  Public (with optional auth for personalized content)
 */
router.get('/', optionalAuth, validateQuery(getPostsQuerySchema), postController.getPosts);

/**
 * @route   GET /api/v1/posts/:id
 * @desc    Get post by ID
 * @access  Public (some posts may require subscription)
 */
router.get('/:id', optionalAuth, postController.getPostById);

/**
 * @route   POST /api/v1/posts
 * @desc    Create new post
 * @access  Private (Creator only)
 */
router.post('/', authenticate, validate(createPostSchema), postController.createPost);

/**
 * @route   PUT /api/v1/posts/:id
 * @desc    Update post
 * @access  Private (Creator/Admin)
 */
router.put('/:id', authenticate, validate(updatePostSchema), postController.updatePost);

/**
 * @route   DELETE /api/v1/posts/:id
 * @desc    Delete post
 * @access  Private (Creator/Admin)
 */
router.delete('/:id', authenticate, postController.deletePost);

router.get('/my-posts', authenticate, postController.getMyPosts);
export default router;
