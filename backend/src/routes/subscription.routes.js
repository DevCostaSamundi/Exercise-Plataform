// backend/src/routes/subscription.routes.js
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getMySubscriptions,
  createSubscription,
  cancelSubscription,
  checkSubscription,
} from '../controllers/subscription.controller.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router. use(authenticate);

// GET /api/v1/subscriptions - Listar minhas assinaturas
router. get('/', getMySubscriptions);

// POST /api/v1/subscriptions - Criar assinatura
router.post('/', createSubscription);

// POST /api/v1/subscriptions/:id/cancel - Cancelar assinatura
router.post('/:id/cancel', cancelSubscription);

// GET /api/v1/subscriptions/check/:creatorId - Verificar se está inscrito
router.get('/check/:creatorId', checkSubscription);

export default router;