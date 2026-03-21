// ============================================================
// AI CHAT & SUBSCRIPTION ROUTES
// ============================================================

import { Router } from 'express';
import { authenticate as auth } from '../middleware/auth.middleware.js';
import {
    sendMessage,
    getHistory,
    clearConversation,
} from '../controllers/ai-chat.controller.js';
import {
    subscribe,
    mySubscriptions,
    cancelSubscription,
    getPlans,
} from '../controllers/ai-subscription.controller.js';

const router = Router();

// ── Chat (autenticado) ───────────────────────────────────────
router.post('/chat/:companionId/message', auth, sendMessage);
router.get('/chat/:companionId/history', auth, getHistory);
router.delete('/chat/:companionId', auth, clearConversation);

// ── Subscriptions (autenticado) ──────────────────────────────
router.post('/subscribe/:companionId', auth, subscribe);
router.get('/subscriptions', auth, mySubscriptions);
router.delete('/subscribe/:companionId', auth, cancelSubscription);

// ── Planos (público) ─────────────────────────────────────────
router.get('/plans', getPlans);

export default router;
