// src/routes/creator.routes.js
import express from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';
import {
  listCreators,
  getCreatorByUsername,
  getCreatorProfile,
  getCreatorPostsByUsername,
  getCreatorPosts,
} from '../controllers/creator.controller.js';

const router = express.Router();

// GET /api/v1/creators - Listar todos os criadores
router.get('/', optionalAuth, listCreators);

// GET /api/v1/creators/username/:username - Perfil por username
router.get('/username/: username', optionalAuth, getCreatorByUsername);

// GET /api/v1/creators/username/:username/posts - Posts por username
router.get('/username/: username/posts', optionalAuth, getCreatorPostsByUsername);

// GET /api/v1/creators/:creatorId - Perfil por ID
router.get('/:creatorId', optionalAuth, getCreatorProfile);

// GET /api/v1/creators/:creatorId/posts - Posts por ID
router.get('/:creatorId/posts', optionalAuth, getCreatorPosts);

export default router;