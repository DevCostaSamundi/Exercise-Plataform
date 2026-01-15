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

// ✅ CORRIGIDO:  Remover '/settings' - a rota base já é '/creator/settings'
// GET /api/v1/creator/settings
router.get('/', getCreatorSettings);

// PUT /api/v1/creator/settings
router.put(
  '/',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  updateCreatorSettings
);

export default router;