import express from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import {
  getCreatorProfile,
  getCreatorPosts,
  listCreators,
} from '../controllers/creator.controller.js';

const router = express.Router();

// ============================================
// ROTAS PÚBLICAS
// ============================================

// GET /api/v1/creators - Listar criadores
router.get('/', listCreators);

// GET /api/v1/creators/:id - Perfil público do criador (optional auth)
router.get('/:id', optionalAuth, getCreatorProfile);

// GET /api/v1/creators/:id/posts - Posts do criador (optional auth)
router.get('/:id/posts', optionalAuth, getCreatorPosts);

export default router;