import express from 'express';
import { createOrGetChat, getChatMessages, postMessageFallback } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/chats', authenticate, createOrGetChat);
router.get('/chats/:id/messages', authenticate, getChatMessages);
router.post('/messages', authenticate, postMessageFallback);

export default router;