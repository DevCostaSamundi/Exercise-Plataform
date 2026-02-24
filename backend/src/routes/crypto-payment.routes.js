import express from 'express';
import Joi from 'joi';
import {
    createCryptoOrder,
    verifyPayment,
    getCryptoPaymentStatus,
    getCreatorBalance,
    getOnRampUrl,
    getUSDCPrice,
} from '../controllers/crypto-payment.controller.js';
import {
    alchemyWebhook,
    testAlchemyWebhook,
} from '../controllers/alchemy-webhook.controller.js';
import { createBalancePayment } from '../controllers/balance-payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import validate from '../middleware/validation.middleware.js';

const router = express.Router();

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

const createOrderSchema = Joi.object({
    creatorId: Joi.string().required().messages({ 'any.required': 'creatorId é obrigatório' }),
    type: Joi.string()
        .valid('SUBSCRIPTION', 'SUBSCRIPTION_RENEWAL', 'TIP', 'PPV_MESSAGE', 'PPV_POST')
        .required()
        .messages({ 'any.only': 'Tipo de pagamento inválido' }),
    amountUSD: Joi.number().min(1).max(10000).required().messages({
        'number.min': 'Valor mínimo é $1',
        'number.max': 'Valor máximo é $10.000',
    }),
    subscriptionId: Joi.string().optional().allow(null),
    postId: Joi.string().optional().allow(null),
    messageId: Joi.string().optional().allow(null),
});

const verifyPaymentSchema = Joi.object({
    paymentId: Joi.string().required(),
    txHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required().messages({
        'string.pattern.base': 'Hash de transação inválido',
    }),
});

const balancePaymentSchema = Joi.object({
    creatorId: Joi.string().required(),
    type: Joi.string()
        .valid('SUBSCRIPTION', 'SUBSCRIPTION_RENEWAL', 'TIP', 'PPV_MESSAGE', 'PPV_POST')
        .required(),
    amountUSD: Joi.number().min(1).max(10000).required(),
    subscriptionId: Joi.string().optional().allow(null),
    postId: Joi.string().optional().allow(null),
    messageId: Joi.string().optional().allow(null),
});

// ============================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================

// Webhook Alchemy — validado por assinatura HMAC, não por auth
router.post('/webhook/alchemy', alchemyWebhook);

// Conversão de preço (informativo)
router.get('/crypto/price', getUSDCPrice);

// Endpoints de teste (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
    router.post('/webhook/alchemy/test', testAlchemyWebhook);
}

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================

router.use(authenticate);

// --- Pagamentos Crypto Diretos ---

// Cria ordem de pagamento crypto
router.post('/crypto/create-order', validate(createOrderSchema), createCryptoOrder);

// Verifica transação após envio
router.post('/crypto/verify', validate(verifyPaymentSchema), verifyPayment);

// Status do pagamento (polling)
router.get('/crypto/:paymentId/status', getCryptoPaymentStatus);

// --- Pagamentos via Saldo ---

// Paga usando saldo interno da plataforma
router.post('/balance/create-payment', validate(balancePaymentSchema), createBalancePayment);

// --- Criadores ---

// Saldo do criador (on-chain + off-chain)
router.get('/creators/balance', getCreatorBalance);

// --- Fiat On-Ramp ---

// Gera URL assinada para compra de USDC via cartão/PIX
// Query params: provider (moonpay|transak), amountUSD, walletAddress
router.get('/crypto/onramp-url', getOnRampUrl);

export default router;