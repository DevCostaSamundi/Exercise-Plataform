import express from 'express';
import {
    createCryptoOrder,
    verifyPayment,
    getCryptoPaymentStatus,
    getUSDCPrice,
    getCreatorBalance,
} from '../controllers/crypto-payment.controller.js';
import {
    alchemyWebhook,
    testAlchemyWebhook,
} from '../controllers/alchemy-webhook.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import  validate from '../middleware/validation.middleware.js';
import { createBalancePayment } from '../controllers/balance-payment.controller.js';
import Joi from 'joi';

const router = express.Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createOrderSchema = Joi.object({
    creatorId: Joi.string().required(),
    type: Joi.string()
        .valid('SUBSCRIPTION', 'SUBSCRIPTION_RENEWAL', 'TIP', 'PPV_MESSAGE', 'PPV_POST')
        .required(),
    amountUSD: Joi.number().min(1).max(10000).required(),
    subscriptionId: Joi.string().optional(),
    postId: Joi.string().optional(),
    messageId: Joi.string().optional(),
});

const verifyPaymentSchema = Joi.object({
    paymentId: Joi.string().required(),
    txHash: Joi.string()
        .pattern(/^0x[a-fA-F0-9]{64}$/)
        .required(),
});

// ============================================
// PUBLIC ROUTES
// ============================================

// Webhook (no auth - validated by signature)
router.post('/webhook/alchemy', alchemyWebhook);

// Test webhook (dev only)
if (process.env.NODE_ENV !== 'production') {
    router.post('/webhook/alchemy/test', testAlchemyWebhook);
}

// Price conversion
router.get('/crypto/price', getUSDCPrice);

// ============================================
// PROTECTED ROUTES
// ============================================

router.use(authenticate);

// Create crypto payment order
router.post('/crypto/create-order', validate(createOrderSchema), createCryptoOrder);

// Verify payment transaction
router.post('/crypto/verify', validate(verifyPaymentSchema), verifyPayment);

// Get payment status
router.get('/crypto/:paymentId/status', getCryptoPaymentStatus);

// Get creator balance
router.get('/creators/balance', getCreatorBalance);

// Create balance payment
router.post('/balance/create-payment', authenticate, createBalancePayment);

export default router;