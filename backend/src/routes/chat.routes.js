import express from 'express';
import rateLimit from 'express-rate-limit';
import { createOrGetChat, getChatMessages, postMessageFallback } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rate limiter for chat operations
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many chat requests, please try again later.',
});

// More lenient rate limit for read operations
const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later.',
});

router.post('/chats', authenticate, chatLimiter, createOrGetChat);
router.get('/chats/:id/messages', authenticate, readLimiter, getChatMessages);
router.post('/messages', authenticate, chatLimiter, postMessageFallback);

export default router;