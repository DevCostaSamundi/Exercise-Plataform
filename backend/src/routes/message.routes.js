import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadMedia } from '../middleware/upload.middleware.js';
import messageController from '../controllers/message.controller.js';
import paidMessageController from '../controllers/paidMessage.controller.js';
import messageUploadController from '../controllers/messageUpload.controller.js';

const router = express.Router();

router.use(authenticate);

// ── Conversas ─────────────────────────────────────────────────────────────────
router.get ('/conversations',                         messageController.getConversations);
router.post('/conversations',                         messageController.getOrCreateConversation);
router.get ('/conversations/:conversationId',         messageController.getConversation);
router.get ('/conversations/:conversationId/messages',messageController.getMessages);

// ── Mensagens ─────────────────────────────────────────────────────────────────
router.post('/',                  messageController.sendMessage);
router.post('/:messageId/read',   messageController.markAsRead);

// ── Mensagens pagas (PPV) ─────────────────────────────────────────────────────
router.post('/paid',                    paidMessageController.sendPaidMessage);
router.post('/:messageId/unlock',       paidMessageController.unlockPaidMessage);

// ── Upload de mídia ───────────────────────────────────────────────────────────
// uploadMedia: aceita imagens e vídeos até 100MB, com fileFilter
router.post('/upload', uploadMedia.single('file'), messageUploadController.uploadMessageMedia);

export default router;