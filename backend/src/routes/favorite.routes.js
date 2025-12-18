import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from '../controllers/favorite.controller.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/v1/favorites - Listar favoritos do usuário
router.get('/', getUserFavorites);

// GET /api/v1/favorites/check/:creatorId - Verificar se está nos favoritos
router.get('/check/:creatorId', checkFavorite);

// POST /api/v1/favorites/: creatorId - Adicionar aos favoritos
router.post('/: creatorId', addFavorite);

// DELETE /api/v1/favorites/:creatorId - Remover dos favoritos
router.delete('/:creatorId', removeFavorite);

export default router;