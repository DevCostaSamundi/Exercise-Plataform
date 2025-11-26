import ChatService from '../services/chat.service.js';
import prisma from '../config/database.js';

// POST /api/v1/chats  -> { creatorId }
export async function createOrGetChat(req, res, next) {
  try {
    const userId = req.user?.id || req.userId; // depending on auth middleware
    const { creatorId } = req.body;
    if (!creatorId) return res.status(400).json({ message: 'creatorId required' });
    const chat = await ChatService.getOrCreateDM(creatorId, userId);
    // ensure user joins socket room on frontend
    return res.json({ chatId: chat.id });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/chats/:id/messages?page=&limit=
export async function getChatMessages(req, res, next) {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const items = await prisma.message.findMany({
      where: { chatId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
    return res.json({ items: items.reverse(), page, limit });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/messages  fallback REST
export async function postMessageFallback(req, res, next) {
  try {
    const userId = req.user?.id || req.userId;
    const { chatId, type, content, meta } = req.body;
    const saved = await ChatService.handleChatMessage(userId, { chatId, type, content, meta });
    // broadcast via global.io if exists
    if (global.io) global.io.to(`chat:${saved.chatId}`).emit('chat:message', saved);
    return res.json(saved);
  } catch (err) {
    next(err);
  }
}