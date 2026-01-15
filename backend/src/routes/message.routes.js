// routes/message.routes.js
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import messageController from '../controllers/message.controller.js';
import paidMessageController from '../controllers/paidMessage.controller.js';
import messageUploadController from '../controllers/messageUpload.controller.js';
import multer from 'multer';

const router = express.Router();

// Configurar multer para upload de mídia
const upload = multer({
  storage:  multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// ✅ APLICAR autenticação em todas as rotas
router.use(authenticate);

// ==========================================
// CONVERSAS
// ==========================================
router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController. getOrCreateConversation);
router.get('/conversations/:conversationId', messageController.getConversation);
router.get('/conversations/:conversationId/messages', messageController.getMessages);

// ==========================================
// MENSAGENS
// ==========================================
router.post('/', messageController.sendMessage);
router.post('/:messageId/read', messageController.markAsRead);

// ==========================================
// MENSAGENS PAGAS (PPV)
// ==========================================
router.post('/paid', paidMessageController.sendPaidMessage);
router.post('/:messageId/unlock', paidMessageController.unlockPaidMessage);

// ==========================================
// UPLOAD DE MÍDIA
// ==========================================
router.post('/upload', upload.single('file'), messageUploadController.uploadMessageMedia);

export default router;