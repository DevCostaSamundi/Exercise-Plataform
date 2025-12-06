import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getCreatorProfile,
  getCreatorPosts,
  listCreators,
} from '../controllers/creator.controller.js';

const router = express.Router();

// GET /api/v1/creators - Listar criadores (público)
router.get('/', listCreators);

// GET /api/v1/creators/:creatorId - Obter perfil público do criador
router.get('/:creatorId', getCreatorProfile);

// GET /api/v1/creators/:creatorId/posts - Obter posts do criador
router.get('/:creatorId/posts', getCreatorPosts);

// PUT /api/v1/creators/:creatorId - Atualizar perfil (autenticado)
// TODO: Implement updateCreatorProfile in creator.controller.js
// router.put('/:creatorId', authenticate, updateCreatorProfile);

export default router;