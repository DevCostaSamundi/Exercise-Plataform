import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import jwtConfig from '../config/jwt.js';
import logger from '../utils/logger.js';

export const setupMessageSocket = (io) => {
  const messageNamespace = io.of('/messages');

  // Middleware de autenticação
  messageNamespace.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        logger.warn('❌ Socket connection attempt without token');
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, jwtConfig.secret);

      // Suporta tokens assinados com 'id' (Web3Auth) e 'userId' (email/password)
      const userId = decoded.id || decoded.userId;

      if (!userId) {
        logger.error('❌ Token missing user identifier:', decoded);
        return next(new Error('Invalid token: user identifier missing'));
      }

      socket.userId   = userId;
      socket.userRole = decoded.role;

      logger.info(`✅ Socket authenticated: User ${socket.userId} (${socket.userRole})`);
      next();
    } catch (error) {
      logger.error('❌ Socket authentication error:', error.message);
      return next(new Error(`Authentication failed: ${error.message}`));
    }
  });

  messageNamespace.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`🔌 User ${userId} connected to messages: ${socket.id}`);

    // Room consistente com notification.service e socket.js: 'user:${id}'
    socket.join(`user:${userId}`);

    socket.emit('connected', {
      userId,
      message: 'Connected to messages namespace',
      socketId: socket.id,
    });

    // ── Enviar mensagem ───────────────────────────────────────────────────────
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, recipientId, content, type = 'text' } = data;
        const senderId = userId;

        logger.info(`📤 Sending message from ${senderId} to ${recipientId}`);

        if (!content?.text && !content?.mediaUrl) {
          socket.emit('error', { message: 'Conteúdo vazio' });
          return;
        }

        if (!conversationId || !recipientId) {
          socket.emit('error', { message: 'conversationId e recipientId são obrigatórios' });
          return;
        }

        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversa não encontrada' });
          return;
        }

        const isParticipant =
          conversation.creatorId === senderId ||
          conversation.subscriberId === senderId;

        if (!isParticipant) {
          socket.emit('error', { message: 'Não fazes parte desta conversa' });
          return;
        }

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId,
            recipientId,
            type,
            contentText:     content.text     || null,
            contentMediaUrl: content.mediaUrl || [],
            contentPrice:    content.price    || null,
            contentIsPaid:   content.isPaid   || false,
            status: 'sent',
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        });

        const isCreatorSender = conversation.creatorId === senderId;
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageText:      content.text || 'Mídia',
            lastMessageSenderId:  senderId,
            lastMessageTimestamp: new Date(),
            ...(isCreatorSender
              ? { unreadCountSubscriber: { increment: 1 } }
              : { unreadCountCreator:    { increment: 1 } }),
          },
        });

        const formatted = {
          _id: message.id,
          sender: {
            _id:         message.sender.id,
            username:    message.sender.username,
            displayName: message.sender.displayName,
            avatar:      message.sender.avatar,
          },
          content: {
            text:     message.contentText,
            mediaUrl: message.contentMediaUrl,
            price:    message.contentPrice,
            isPaid:   message.contentIsPaid,
          },
          type:           message.type,
          status:         message.status,
          createdAt:      message.createdAt,
          conversationId,
        };

        // Confirmação para o remetente
        socket.emit('message_sent', formatted);

        // Entrega ao destinatário — room consistente com o resto da app
        messageNamespace.to(`user:${recipientId}`).emit('new_message', formatted);

        logger.info(`✅ Message delivered: ${message.id}`);
      } catch (error) {
        logger.error('❌ Socket send_message error:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem', details: error.message });
      }
    });

    // ── Indicador de digitação ────────────────────────────────────────────────
    socket.on('typing_start', ({ conversationId, recipientId }) => {
      messageNamespace.to(`user:${recipientId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId, recipientId }) => {
      messageNamespace.to(`user:${recipientId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // ── Marcar como lido ──────────────────────────────────────────────────────
    socket.on('mark_as_read', async ({ messageIds }) => {
      try {
        await prisma.message.updateMany({
          where: {
            id:          { in: messageIds },
            recipientId: userId,
          },
          data: {
            status: 'read',
            readAt: new Date(),
          },
        });

        socket.emit('messages_read', { messageIds });
        logger.info(`✅ Messages marked as read: ${messageIds.length}`);
      } catch (error) {
        logger.error('❌ Socket mark_as_read error:', error);
      }
    });

    // ── Desconexão ────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info(`❌ User ${userId} disconnected from messages: ${reason}`);
    });
  });

  logger.info('✅ Message socket namespace configured');
  return messageNamespace;
};