import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  addComment,
  getComments,
  deleteComment,
} from '../controllers/comment.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/posts/:postId/comments
 * @desc    Get comments for a post
 * @access  Private
 */
router.get('/posts/:postId/comments', getComments);

/**
 * @route   POST /api/v1/posts/:postId/comments
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post('/posts/:postId/comments', addComment);

/**
 * @route   DELETE /api/v1/comments/:commentId
 * @desc    Delete a comment
 * @access  Private (owner or post creator only)
 */
router.delete('/comments/:commentId', deleteComment);

export default router;
