import express from 'express';
import { authenticate, requireCreator } from '../middleware/auth.middleware.js';
import {
  getMyPosts,
  // TODO: Implement these functions in creatorPost.controller.js
  // createPost,
  // updatePost,
  // deletePost,
  // bulkDeletePosts,
} from '../controllers/creatorPost.controller.js';
import upload from '../config/multer.js';

const router = express.Router();

// Todas as rotas requerem autenticação de criador
router.use(authenticate);
router.use(requireCreator);

// GET /api/v1/creator/posts - Obter meus posts
router.get('/', getMyPosts);

// POST /api/v1/creator/posts - Criar novo post
// TODO: Uncomment when createPost is implemented
// router.post(
//   '/',
//   upload.fields([
//     { name: 'media', maxCount: 10 },
//     { name: 'thumbnail', maxCount: 1 },
//   ]),
//   createPost
// );

// PUT /api/v1/creator/posts/:id - Atualizar post
// TODO: Uncomment when updatePost is implemented
// router.put(
//   '/:id',
//   upload.fields([
//     { name: 'media', maxCount: 11 },
//     { name: 'thumbnail', maxCount: 1 },
//   ]),
//   updatePost
// );

// DELETE /api/v1/creator/posts/:id - Deletar post
// TODO: Uncomment when deletePost is implemented
// router.delete('/:id', deletePost);

// POST /api/v1/creator/posts/bulk-delete - Deletar múltiplos posts
// TODO: Uncomment when bulkDeletePosts is implemented
// router.post('/bulk-delete', bulkDeletePosts);

export default router;
