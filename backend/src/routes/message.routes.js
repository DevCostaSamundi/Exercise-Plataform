import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  getOrCreateConversation,
  markAsRead,
} from '../controllers/message.controller.js';
import { uploadMessageMedia } from '../controllers/messageUpload.controller.js';
import {
  sendPaidMessage,
  unlockPaidMessage,
} from '../controllers/paidMessage.controller.js';

const router = express.Router();

// Configurar multer para memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// ✅ Todas as rotas requerem autenticação
router. use(authenticate);

// ============================================
// ROTAS PRINCIPAIS DE MENSAGENS
// ============================================

// GET /api/v1/messages/conversations - Listar conversas
router.get('/conversations', getConversations);

// POST /api/v1/messages/conversations - Criar ou buscar conversa
router.post('/conversations', getOrCreateConversation);

// GET /api/v1/messages/:conversationId - Buscar mensagens de uma conversa
router.get('/:conversationId', getMessages);

// POST /api/v1/messages - Enviar mensagem
router. post('/', sendMessage);

// PUT /api/v1/messages/:messageId/read - Marcar como lida
router.put('/:messageId/read', markAsRead);

// ============================================
// ROTAS DE UPLOAD
// ============================================

// POST /api/v1/messages/upload - Upload de mídia
router. post('/upload', upload.single('file'), uploadMessageMedia);

// ============================================
// ROTAS DE MENSAGENS PAGAS (PPV)
// ============================================

// POST /api/v1/messages/paid - Enviar mensagem paga
router.post('/paid', sendPaidMessage);

// POST /api/v1/messages/:messageId/unlock - Desbloquear mensagem paga
router.post('/:messageId/unlock', unlockPaidMessage);

export default router;