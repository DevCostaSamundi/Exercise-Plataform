import express from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';
import {
  getCreatorProfile,
  getCreatorByUsername,
  getCreatorPosts,
  getCreatorPostsByUsername,
  listCreators,
} from '../controllers/creator.controller.js';

const router = express.Router();

// GET /api/v1/creators - Listar criadores (público com auth opcional)
router.get('/', optionalAuth, listCreators);

// GET /api/v1/creators/username/:username - Obter perfil por username
router.get('/username/:username', optionalAuth, getCreatorByUsername);

// GET /api/v1/creators/username/:username/posts - Obter posts por username
router.get('/username/:username/posts', optionalAuth, getCreatorPostsByUsername);

// GET /api/v1/creators/:creatorId - Obter perfil público do criador por ID
router.get('/:creatorId', optionalAuth, getCreatorProfile);

// GET /api/v1/creators/:creatorId/posts - Obter posts do criador
router.get('/:creatorId/posts', optionalAuth, getCreatorPosts);

export default router;
