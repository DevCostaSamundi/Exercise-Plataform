import express from 'express';
import { authenticate, requireCreator } from '../middleware/auth.middleware.js';
import {
  getCreatorSettings,
  updateCreatorSettings,
} from '../controllers/creatorSettings.controller.js';
import upload from '../config/multer.js';

const router = express.Router();

// Todas as rotas requerem autenticação de criador
router.use(authenticate);
router.use(requireCreator);

// GET /api/v1/creator/settings - Obter configurações
router.get('/settings', getCreatorSettings);

// PUT /api/v1/creator/settings - Atualizar configurações
router.put(
  '/settings',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  updateCreatorSettings
);

// GET /api/v1/creator/dashboard - Dashboard data
router.get('/dashboard', async (req, res) => {
  // TODO: Implementar controller
  res.json({
    success: true,
    data: {
      earnings: 1234.56,
      subscribers: 42,
      posts: 17,
      lastPayment: '2024-06-01',
    }
  });
});

export default router;
