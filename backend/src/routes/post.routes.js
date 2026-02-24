import { Router } from 'express';
import postController from '../controllers/post.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Rotas específicas PRIMEIRO
router.get('/my-posts', authenticate, (req, res, next) => {
  postController.getMyPosts(req, res, next);
});

router.get('/feed', authenticate, (req, res, next) => {  // ← ADICIONAR
  postController.getFeed(req, res, next);
});

router.post('/bulk-delete', authenticate, (req, res, next) => {
  postController.bulkDeletePosts(req, res, next);
});

router.get('/', (req, res, next) => {
  postController.getPosts(req, res, next);
});

router.post('/', authenticate, (req, res, next) => {
  postController.createPost(req, res, next);
});

// Rotas com :id POR ÚLTIMO
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