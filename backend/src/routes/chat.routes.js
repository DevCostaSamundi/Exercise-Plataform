import express from 'express';
import { createOrGetChat, getChatMessages, postMessageFallback } from '../controllers/chat.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/chats', authMiddleware, createOrGetChat);
router.get('/chats/:id/messages', authMiddleware, getChatMessages);
router.post('/messages', authMiddleware, postMessageFallback);

export default router;