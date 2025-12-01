import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createPayment,
  getPaymentStatus,
  getUserPayments,
  getAvailableCurrencies,
  estimatePrice,
} from '../controllers/payment.controller.js';
import {
  nowpaymentsWebhook,
  btcpayWebhook,
  pixWebhook,
} from '../controllers/webhook. controller.js';

const router = express.Router();

// ============================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================

// GET /api/v1/payments/currencies - Listar moedas disponíveis
router. get('/currencies', getAvailableCurrencies);

// GET /api/v1/payments/estimate - Estimar preço
router.get('/estimate', estimatePrice);

// ============================================
// WEBHOOKS (sem autenticação - validação por assinatura)
// ============================================

// POST /api/v1/payments/webhook/nowpayments
router.post('/webhook/nowpayments', nowpaymentsWebhook);

// POST /api/v1/payments/webhook/btcpay
router.post('/webhook/btcpay', btcpayWebhook);

// POST /api/v1/payments/webhook/pix
router.post('/webhook/pix', pixWebhook);

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================

router.use(authenticate);

// POST /api/v1/payments - Criar pagamento
router.post('/', createPayment);

// GET /api/v1/payments - Listar pagamentos do usuário
router.get('/', getUserPayments);

// GET /api/v1/payments/:paymentId - Obter status de um pagamento
router.get('/:paymentId', getPaymentStatus);

export default router;