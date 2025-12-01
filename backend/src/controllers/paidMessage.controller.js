import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Enviar mensagem paga
export const sendPaidMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, recipientId, content, price } = req.body;

    // Validações
    if (!price || price < 5 || price > 500) {
      return res.status(400).json({
        success: false,
        message: 'Preço deve estar entre R$ 5,00 e R$ 500,00',
      });
    }

    if (!content?.mediaUrl || content.mediaUrl.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mensagens pagas devem conter mídia',
      });
    }

    // Buscar conversa
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada',
      });
    }

    // Apenas criadores podem enviar mensagens pagas
    if (conversation.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Apenas criadores podem enviar mensagens pagas',
      });
    }

    // Criar mensagem paga
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        recipientId,
        type: 'paid',
        contentText: content.text || 'Conteúdo exclusivo 🔒',
        contentMediaUrl: content.mediaUrl,
        contentPrice: price,
        contentIsPaid: false, // Não pago ainda
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
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageText: `💰 Conteúdo pago - R$ ${price. toFixed(2)}`,
        lastMessageSenderId: userId,
        lastMessageTimestamp: new Date(),
        unreadCountSubscriber: { increment: 1 },
      },
    });

    const formatted = {
      _id: message.id,
      sender: {
        _id: message. sender.id,
        username: message.sender.username,
        displayName: message.sender.displayName,
        avatar: message. sender.avatar,
      },
      content: {
        text: message.contentText,
        mediaUrl: message.contentMediaUrl,
        price: message.contentPrice,
        isPaid: message. contentIsPaid,
      },
      type: message.type,
      status: message.status,
      createdAt: message. createdAt,
    };

    res.status(201).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    logger. error('Error sending paid message:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem paga',
    });
  }
};

// Desbloquear mensagem paga
export const unlockPaidMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req. user.id;
    const { paymentMethod = 'crypto' } = req.body;

    // Buscar mensagem
    const message = await prisma. message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada',
      });
    }

    // Verificar se é o destinatário
    if (message. recipientId !== userId) {
      return res.status(403). json({
        success: false,
        message: 'Acesso negado',
      });
    }

    // Verificar se já foi paga
    if (message.contentIsPaid) {
      return res.json({
        success: true,
        message: 'Mensagem já desbloqueada',
        data: {
          mediaUrl: message.contentMediaUrl,
        },
      });
    }

    // TODO: Integrar com gateway de pagamento real
    // Por enquanto, simular pagamento bem-sucedido

    // Atualizar mensagem
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        contentIsPaid: true,
      },
    });

    // TODO: Registrar transação
    // TODO: Adicionar aos ganhos do criador

    res.json({
      success: true,
      message: 'Mensagem desbloqueada com sucesso',
      data: {
        mediaUrl: updated.contentMediaUrl,
        price: updated.contentPrice,
        paymentMethod,
      },
    });
  } catch (error) {
    logger.error('Error unlocking paid message:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desbloquear mensagem',
    });
  }
};

export default {
  sendPaidMessage,
  unlockPaidMessage,
};