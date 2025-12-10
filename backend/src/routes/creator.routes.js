import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getCreatorProfile,
  getCreatorByUsername,
  getCreatorPosts,
  getCreatorPostsByUsername,
  listCreators,
} from '../controllers/creator.controller.js';

const router = express.Router();

// GET /api/v1/creators - Listar criadores (público)
router.get('/', listCreators);

// GET /api/v1/creators/username/:username - Obter perfil por username (must come before /:creatorId)
router.get('/username/:username', getCreatorByUsername);

// GET /api/v1/creators/username/:username/posts - Obter posts por username
router.get('/username/:username/posts', getCreatorPostsByUsername);

// GET /api/v1/creators/:creatorId - Obter perfil público do criador por ID
router.get('/:creatorId', getCreatorProfile);

// GET /api/v1/creators/:creatorId/posts - Obter posts do criador
router.get('/:creatorId/posts', getCreatorPosts);

// PUT /api/v1/creators/:creatorId - Atualizar perfil (autenticado)
// TODO: Implement updateCreatorProfile in creator.controller.js
// router.put('/:creatorId', authenticate, updateCreatorProfile);

export default router;