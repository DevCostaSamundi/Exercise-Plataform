// backend/src/routes/post.routes.js
import { Router } from 'express';
import postController from '../controllers/post.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// ============================================
// ⚠️ ORDEM CRÍTICA! Rotas específicas PRIMEIRO
// ============================================

// ✅ ESTAS ROTAS DEVEM VIR PRIMEIRO (antes de /:id)
router.get('/my-posts', authenticate, (req, res, next) => {
  postController.getMyPosts(req, res, next);
});

router.post('/bulk-delete', authenticate, (req, res, next) => {
  postController.bulkDeletePosts(req, res, next);
});

// ✅ Rotas gerais
router.get('/', (req, res, next) => {
  postController.getPosts(req, res, next);
});

router.post('/', authenticate, (req, res, next) => {
  postController.createPost(req, res, next);
});

// ✅ ESTAS ROTAS DEVEM VIR POR ÚLTIMO (com :id)
router.get('/:id', (req, res, next) => {
  postController.getPostById(req, res, next);
});

router.patch('/:id', authenticate, (req, res, next) => {
  postController.updatePost(req, res, next);
});

router.delete('/:id', authenticate, (req, res, next) => {
  postController.deletePost(req, res, next);
});

export default router;