import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export const setupMessageSocket = (io) => {
  const messageNamespace = io.of('/messages');

  // ✅ Middleware de autenticação
  messageNamespace.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        logger.warn('❌ Socket connection attempt without token');
        return next(new Error('Authentication token required'));
      }

      // ✅ DECODIFICAR TOKEN - Usar a mesma secret do jwtConfig
      const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;

      if (!JWT_SECRET) {
        logger.error('❌ JWT_SECRET not configured');
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      // ✅ DEBUG: Ver o que está no token
      logger.info('🔍 Decoded token:', decoded);

      // ✅ Extrair userId (seu JwtService usa 'userId')
      if (!decoded.userId) {
        logger.error('❌ Token missing userId:', decoded);
        return next(new Error('Invalid token:  userId missing'));
      }

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      logger.info(`✅ Socket authenticated:  User ${socket.userId} (${socket.userRole})`);
      next();
    } catch (error) {
      logger.error('❌ Socket authentication error:', error.message);
      return next(new Error(`Authentication failed: ${error.message}`));
    }
  });

  messageNamespace.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`🔌 User ${userId} connected to messages:  ${socket.id}`);

    // ✅ Auto-join user room
    socket.join(`user_${userId}`);

    // Confirmar conexão
    socket.emit('connected', {
      userId,
      message: 'Connected to messages namespace',
      socketId: socket.id
    });

    // ==========================================
    // 📨 ENVIAR MENSAGEM
    // ==========================================
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, recipientId, content, type = 'text' } = data;
        const senderId = userId; // ✅ Usar userId autenticado

        logger.info(`📤 Sending message from ${senderId} to ${recipientId}`);

        // Validações
        if (!content?.text && !content?.mediaUrl) {
          socket.emit('error', { message: 'Conteúdo vazio' });
          return;
        }

        if (!conversationId || !recipientId) {
          socket.emit('error', { message: 'conversationId e recipientId são obrigatórios' });
          return;
        }

        // Buscar conversa
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversa não encontrada' });
          return;
        }

        // ✅ Verificar se o usuário faz parte da conversa
        const isParticipant =
          conversation.creatorId === senderId ||
          conversation.subscriberId === senderId;

        if (!isParticipant) {
          socket.emit('error', { message: 'Você não faz parte desta conversa' });
          return;
        }

        // Criar mensagem
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId,
            recipientId,
            type,
            contentText: content.text || null,
            contentMediaUrl: content.mediaUrl || [],
            contentPrice: content.price || null,
            contentIsPaid: content.isPaid || false,
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

        // Atualizar conversa
        const isCreatorSender = conversation.creatorId === senderId;
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageText: content.text || 'Mídia',
            lastMessageSenderId: senderId,
            lastMessageTimestamp: new Date(),
            ...(isCreatorSender
              ? { unreadCountSubscriber: { increment: 1 } }
              : { unreadCountCreator: { increment: 1 } }),
          },
        });

        // Formatar mensagem
        const formatted = {
          _id: message.id,
          sender: {
            _id: message.sender.id,
            username: message.sender.username,
            displayName: message.sender.displayName,
            avatar: message.sender.avatar,
          },
          content: {
            text: message.contentText,
            mediaUrl: message.contentMediaUrl,
            price: message.contentPrice,
            isPaid: message.contentIsPaid,
          },
          type: message.type,
          status: message.status,
          createdAt: message.createdAt,
          conversationId,
        };

        // ✅ Enviar confirmação para o remetente
        socket.emit('message_sent', formatted);

        // ✅ Enviar para o destinatário
        messageNamespace.to(`user_${recipientId}`).emit('new_message', formatted);

        logger.info(`✅ Message delivered:  ${message.id}`);
      } catch (error) {
        logger.error('❌ Socket send_message error:', error);
        socket.emit('error', {
          message: 'Erro ao enviar mensagem',
          details: error.message
        });
      }
    });

    // ==========================================
    // ⌨️ INDICADOR DE DIGITAÇÃO
    // ==========================================
    socket.on('typing_start', ({ conversationId, recipientId }) => {
      logger.info(`⌨️ User ${userId} typing to ${recipientId}`);
      messageNamespace.to(`user_${recipientId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId, recipientId }) => {
      messageNamespace.to(`user_${recipientId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // ==========================================
    // ✅ MARCAR COMO LIDO
    // ==========================================
    socket.on('mark_as_read', async ({ messageIds }) => {
      try {
        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
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

    // ==========================================
    // 🔌 DESCONEXÃO
    // ==========================================
    socket.on('disconnect', (reason) => {
      logger.info(`❌ User ${userId} disconnected from messages: ${reason}`);
    });
  });

  logger.info('✅ Message socket namespace configured');
  return messageNamespace;
};