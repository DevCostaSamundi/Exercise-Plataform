import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export const setupMessageSocket = (io) => {
  // Namespace para mensagens
  const messageNamespace = io.of('/messages');

  messageNamespace.on('connection', (socket) => {
    logger. info(`Client connected to messages: ${socket.id}`);

    // Usuário se junta à sua sala pessoal
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      logger.info(`User ${userId} joined their room`);
    });

    // Enviar mensagem em tempo real
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, senderId, recipientId, content, type = 'text' } = data;

        // Validações
        if (!content?. text && !content?.mediaUrl) {
          socket.emit('error', { message: 'Conteúdo vazio' });
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

        // Criar mensagem
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId,
            recipientId,
            type,
            contentText: content.text,
            contentMediaUrl: content.mediaUrl || [],
            contentPrice: content.price,
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
            username: message.sender. username,
            displayName: message.sender.displayName,
            avatar: message.sender.avatar,
          },
          content: {
            text: message.contentText,
            mediaUrl: message. contentMediaUrl,
            price: message.contentPrice,
            isPaid: message.contentIsPaid,
          },
          type: message.type,
          status: message.status,
          createdAt: message.createdAt,
        };

        // Enviar para o remetente
        socket.emit('message_sent', formatted);

        // Enviar para o destinatário
        messageNamespace.to(`user_${recipientId}`).emit('new_message', {
          ...formatted,
          conversationId,
        });

        logger.info(`Message sent from ${senderId} to ${recipientId}`);
      } catch (error) {
        logger.error('Socket send_message error:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem' });
      }
    });

    // Indicador de digitação
    socket.on('typing_start', ({ conversationId, userId, recipientId }) => {
      messageNamespace.to(`user_${recipientId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId, userId, recipientId }) => {
      messageNamespace. to(`user_${recipientId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // Marcar mensagens como lidas
    socket.on('mark_as_read', async ({ messageIds, userId }) => {
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
      } catch (error) {
        logger.error('Socket mark_as_read error:', error);
      }
    });

    socket.on('disconnect', () => {
      logger. info(`Client disconnected from messages: ${socket.id}`);
    });
  });

  return messageNamespace;
};