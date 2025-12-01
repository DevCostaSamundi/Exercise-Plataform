import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
const prisma = new PrismaClient();

// Obter todas as conversas do usuário
export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status = 'active' } = req.query;

        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { creatorId: userId },
                    { subscriberId: userId },
                ],
                status,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                        isVerified: true,
                    },
                },
                subscriber: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                        isVerified: true,
                    },
                },
            },
            orderBy: {
                lastMessageTimestamp: 'desc',
            },
        });

        // Formatar resposta
        const formatted = conversations.map((conv) => {
            const isCreator = conv.creatorId === userId;
            const otherUser = isCreator ? conv.subscriber : conv.creator;
            const unreadCount = isCreator
                ? conv.unreadCountCreator
                : conv.unreadCountSubscriber;

            return {
                id: conv.id,
                otherUser: {
                    id: otherUser.id,
                    username: otherUser.username,
                    displayName: otherUser.displayName,
                    avatar: otherUser.avatar,
                    isVerified: otherUser.isVerified,
                },
                lastMessage: conv.lastMessageText
                    ? {
                        text: conv.lastMessageText,
                        sender: { _id: conv.lastMessageSenderId },
                        timestamp: conv.lastMessageTimestamp,
                    }
                    : null,
                unreadCount,
                isVIP: conv.isVIP,
                status: conv.status,
                updatedAt: conv.updatedAt,
            };
        });

        res.json({
            success: true,
            data: formatted,
        });
    } catch (error) {
        logger.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar conversas',
        });
    }
};

// Obter mensagens de uma conversa
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        const { limit = 50, before } = req.query;

        // Verificar se usuário faz parte da conversa
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversa não encontrada',
            });
        }

        const isParticipant =
            conversation.creatorId === userId ||
            conversation.subscriberId === userId;

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado',
            });
        }

        // Buscar mensagens
        const whereClause = {
            conversationId,
            deletedAt: null,
        };

        if (before) {
            whereClause.createdAt = { lt: new Date(before) };
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
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
            orderBy: {
                createdAt: 'desc',
            },
            take: parseInt(limit),
        });

        // Marcar mensagens como lidas
        await prisma.message.updateMany({
            where: {
                conversationId,
                recipientId: userId,
                status: { not: 'read' },
            },
            data: {
                status: 'read',
                readAt: new Date(),
            },
        });

        // Resetar contador de não lidas
        const isCreator = conversation.creatorId === userId;
        await prisma.conversation.update({
            where: { id: conversationId },
            data: isCreator
                ? { unreadCountCreator: 0 }
                : { unreadCountSubscriber: 0 },
        });

        // Formatar mensagens
        const formatted = messages.reverse().map((msg) => ({
            _id: msg.id,
            sender: {
                _id: msg.sender.id,
                username: msg.sender.username,
                displayName: msg.sender.displayName,
                avatar: msg.sender.avatar,
            },
            content: {
                text: msg.contentText,
                mediaUrl: msg.contentMediaUrl,
                price: msg.contentPrice,
                isPaid: msg.contentIsPaid,
            },
            type: msg.type,
            status: msg.status,
            createdAt: msg.createdAt,
            readAt: msg.readAt,
        }));

        res.json({
            success: true,
            data: formatted,
        });
    } catch (error) {
        logger.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar mensagens',
        });
    }
};

// Enviar mensagem
export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId, recipientId, type = 'text', content } = req.body;

        // Validações
        if (!content?.text && !content?.mediaUrl) {
            return res.status(400).json({
                success: false,
                message: 'Conteúdo da mensagem é obrigatório',
            });
        }

        if (content.text && content.text.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Mensagem muito longa (máximo 1000 caracteres)',
            });
        }

        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: 'ID do destinatário é obrigatório',
            });
        }

        // Buscar ou criar conversa
        let conversation = conversationId
            ? await prisma.conversation.findUnique({ where: { id: conversationId } })
            : null;

        if (!conversation) {
            // Tentar encontrar conversa existente
            conversation = await prisma.conversation.findFirst({
                where: {
                    OR: [
                        { creatorId: userId, subscriberId: recipientId },
                        { creatorId: recipientId, subscriberId: userId },
                    ],
                },
            });

            // Criar nova se não existir
            if (!conversation) {
                conversation = await prisma.conversation.create({
                    data: {
                        creatorId: recipientId, // Assumir que recipiente é o creator
                        subscriberId: userId,
                        status: 'active',
                    },
                });
            }
        }

        // Criar mensagem
        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: userId,
                recipientId,
                type,
                contentText: content.text,
                contentMediaUrl: content.mediaUrl || [],
                contentPrice: content.price,
                contentIsPaid: content.isPaid || false,
                status: 'sent',
                metadataIpAddress: req.ip,
                metadataUserAgent: req.headers['user-agent'],
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
        const isCreatorSender = conversation.creatorId === userId;
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageText: content.text || 'Mídia',
                lastMessageSenderId: userId,
                lastMessageTimestamp: new Date(),
                ...(isCreatorSender
                    ? { unreadCountSubscriber: { increment: 1 } }
                    : { unreadCountCreator: { increment: 1 } }),
            },
        });

        // Formatar resposta
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
        };

        res.status(201).json({
            success: true,
            data: formatted,
        });
    } catch (error) {
        logger.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem',
        });
    }
};

// Criar ou buscar conversa
export const getOrCreateConversation = async (req, res) => {
    console.log('🔥 getOrCreateConversation CHAMADO! ');
    console.log('🔥 User:', req.user);
    console.log('🔥 Body:', req.body);

    try {
        const userId = req.user.id;
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: 'ID do destinatário é obrigatório',
            });
        }

        // Buscar conversa existente
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { creatorId: userId, subscriberId: recipientId },
                    { creatorId: recipientId, subscriberId: userId },
                ],
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                        isVerified: true,
                    },
                },
                subscriber: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatar: true,
                        isVerified: true,
                    },
                },
            },
        });

        // Criar se não existir
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    creatorId: recipientId,
                    subscriberId: userId,
                    status: 'active',
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatar: true,
                            isVerified: true,
                        },
                    },
                    subscriber: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            avatar: true,
                            isVerified: true,
                        },
                    },
                },
            });
        }

        res.json({
            success: true,
            data: conversation,
        });
    } catch (error) {
        logger.error('Error getting/creating conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar conversa',
        });
    }
};

// Marcar mensagem como lida
export const markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Mensagem não encontrada',
            });
        }

        if (message.recipientId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado',
            });
        }

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: {
                status: 'read',
                readAt: new Date(),
            },
        });

        res.json({
            success: true,
            data: updated,
        });
    } catch (error) {
        logger.error('Error marking message as read:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar mensagem como lida',
        });
    }
};

export default {
    getConversations,
    getMessages,
    sendMessage,
    getOrCreateConversation,
    markAsRead,
};