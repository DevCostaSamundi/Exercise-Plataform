import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  checkSubscription,
  getUserSubscriptions,
  cancelSubscription,
} from '../controllers/subscription.controller.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/v1/subscriptions - Listar assinaturas do usuário
router.get('/', getUserSubscriptions);

// GET /api/v1/subscriptions/check/:creatorId - Verificar se está inscrito
router.get('/check/:creatorId', checkSubscription);

// DELETE /api/v1/subscriptions/:subscriptionId - Cancelar assinatura
router.delete('/:subscriptionId', cancelSubscription);

export default router;