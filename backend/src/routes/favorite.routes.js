import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from '../controllers/favorite.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/favorites
 * @desc    Get user's favorite creators
 * @access  Private
 */
router.get('/', getUserFavorites);

/**
 * @route   POST /api/v1/favorites/:creatorId
 * @desc    Add creator to favorites
 * @access  Private
 */
router.post('/:creatorId', addFavorite);

/**
 * @route   DELETE /api/v1/favorites/:creatorId
 * @desc    Remove creator from favorites
 * @access  Private
 */
router.delete('/:creatorId', removeFavorite);

/**
 * @route   GET /api/v1/favorites/check/:creatorId
 * @desc    Check if creator is favorited
 * @access  Private
 */
router.get('/check/:creatorId', checkFavorite);

export default router;
