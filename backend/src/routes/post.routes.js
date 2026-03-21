import { Router } from 'express';
import postController from '../controllers/post.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// ⚠️  Rotas específicas SEMPRE antes das dinâmicas (:id)

// GET /api/v1/posts/feed
router.get('/feed', authenticate, (req, res, next) => {
  postController.getFeed(req, res, next);
});

// GET /api/v1/posts/my-posts
router.get('/my-posts', authenticate, (req, res, next) => {
  postController.getMyPosts(req, res, next);
});

// POST /api/v1/posts/bulk-delete
router.post('/bulk-delete', authenticate, (req, res, next) => {
  postController.bulkDeletePosts(req, res, next);
});

// GET /api/v1/posts
router.get('/', optionalAuth, (req, res, next) => {
  postController.getPosts(req, res, next);
});

// POST /api/v1/posts
router.post('/', authenticate, (req, res, next) => {
  postController.createPost(req, res, next);
});

// GET /api/v1/posts/:id
// optionalAuth: controller verifica req.user para posts privados
// sem optionalAuth req.user seria undefined em vez de null → comportamento diferente
router.get('/:id', optionalAuth, (req, res, next) => {
  postController.getPostById(req, res, next);
});

// PATCH /api/v1/posts/:id
router.patch('/:id', authenticate, (req, res, next) => {
  postController.updatePost(req, res, next);
});

// DELETE /api/v1/posts/:id
router.delete('/:id', authenticate, (req, res, next) => {
  postController.deletePost(req, res, next);
});

export default router;