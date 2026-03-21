import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getMySubscriptions,
  createSubscription,
  confirmSubscriptionPayment,
  cancelSubscription,
  checkSubscription,
} from '../controllers/subscription.controller.js';

const router = express.Router();

router.use(authenticate);

// GET /api/v1/subscriptions
router.get('/', getMySubscriptions);

// POST /api/v1/subscriptions — inicia assinatura (cria PENDING)
router.post('/', createSubscription);

// POST /api/v1/subscriptions/:id/confirm — confirma pagamento on-chain → activa
router.post('/:id/confirm', confirmSubscriptionPayment);

// POST /api/v1/subscriptions/:id/cancel
router.post('/:id/cancel', cancelSubscription);

// GET /api/v1/subscriptions/check/:creatorId
// ⚠️  deve ficar ANTES de /:id para não ser interceptada
router.get('/check/:creatorId', checkSubscription);

export default router;