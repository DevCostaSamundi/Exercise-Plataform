import express from 'express';
import { authenticate, authorizeCreator } from '../middleware/auth.middleware.js';
import {
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  bulkDeletePosts,
} from '../controllers/creatorPost.controller.js';

const router = express.Router();

// ✅ Todas as rotas exigem autenticação de criador
router.use(authenticate, authorizeCreator);

// GET /api/v1/creator/posts - Obter meus posts
router.get('/', getMyPosts);

// POST /api/v1/creator/posts - Criar post
router.post('/', createPost);

// PUT /api/v1/creator/posts/:id - Atualizar post
router.put('/:id', updatePost);

// DELETE /api/v1/creator/posts/:id - Deletar post
router.delete('/:id', deletePost);

// POST /api/v1/creator/posts/bulk-delete - Deletar múltiplos
router.post('/bulk-delete', bulkDeletePosts);

export default router;