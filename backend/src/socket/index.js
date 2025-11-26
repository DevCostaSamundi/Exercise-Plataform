// Socket.IO server + handlers (auth, chat:message, live:message, tip:send, moderation)
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import ChatService from '../services/chat.service.js';
import prisma from '../config/database.js';

export default function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId || decoded.user;
      return next();
    } catch (err) {
      logger.warn('Socket auth failed', err?.message || err);
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} user:${socket.userId}`);

    // join user personal room
    socket.join(`user:${socket.userId}`);

    socket.on('join:live', async ({ liveId }) => {
      socket.join(`live:${liveId}`);
      logger.info(`User ${socket.userId} joined live:${liveId}`);
    });

    socket.on('leave:live', ({ liveId }) => {
      socket.leave(`live:${liveId}`);
    });

    socket.on('chat:message', async (payload, cb) => {
      try {
        const saved = await ChatService.handleChatMessage(socket.userId, payload);
        // broadcast to chat room
        io.to(`chat:${saved.chatId}`).emit('chat:message', saved);
        if (cb) cb(null, saved);
      } catch (err) {
        logger.warn('chat:message failed', err?.message || err);
        if (cb) cb(err.message || 'Error sending message');
      }
    });

    socket.on('live:message', async (payload, cb) => {
      try {
        const saved = await ChatService.handleLiveMessage(socket.userId, payload);
        io.to(`live:${saved.meta?.liveId || payload.liveId}`).emit('live:message', saved);
        if (cb) cb(null, saved);
      } catch (err) {
        logger.warn('live:message failed', err?.message || err);
        if (cb) cb(err.message || 'Error sending live message');
      }
    });

    socket.on('tip:send', async (payload, cb) => {
      try {
        const savedTipMessage = await ChatService.handleTip(socket.userId, payload);
        // broadcast highlight event
        io.to(`live:${payload.liveId}`).emit('live:message', savedTipMessage);
        io.to(`creator:${savedTipMessage.meta?.creatorId}`).emit('notification:new', { type: 'tip', tip: savedTipMessage });
        if (cb) cb(null, savedTipMessage);
      } catch (err) {
        logger.warn('tip:send failed', err?.message || err);
        if (cb) cb(err.message || 'Tip failed');
      }
    });

    socket.on('moderation:delete', async ({ chatId, messageId }, cb) => {
      try {
        // minimal: mark message deleted
        await prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date() } });
        io.to(`chat:${chatId}`).emit('moderation:deleted', { chatId, messageId });
        if (cb) cb(null, { ok: true });
      } catch (err) {
        logger.warn('moderation delete failed', err?.message || err);
        if (cb) cb(err.message || 'Delete failed');
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected ${socket.id} reason:${reason}`);
    });
  });

  // attach io to global for access (optional)
  global.io = io;
  return io;
}