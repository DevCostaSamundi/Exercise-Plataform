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
  stripeWebhook, // 👈 ADICIONAR
} from '../controllers/webhook.controller.js';

const router = express.Router();

// ============================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================

// GET /api/v1/payments/currencies - Listar moedas disponíveis
router.get('/currencies', getAvailableCurrencies);

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

// POST /api/v1/payments/webhook/stripe 👈 ADICIONAR
router. post('/webhook/stripe', stripeWebhook);

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

// ...  (imports existentes)

// ✅ ROTA DE TESTE - Aprovar pagamento simulado manualmente
router.post('/test/approve/:paymentId', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Apenas em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Only available in development',
      });
    }

    const payment = await prisma.payment.findUnique({
      where:  { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Simular aprovação
    const updated = await paymentService.updatePaymentStatus(paymentId, {
      status: 'finished',
      actually_paid: payment.expectedAmount,
      confirmations: 1,
    });

    res.json({
      success: true,
      message: 'Payment approved (simulated)',
      data: updated,
    });
  } catch (error) {
    logger.error('Test approve error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;