// ============================================================
// AI CHAT CONTROLLER
// Enviar mensagens, buscar histórico, limpar conversa
// ============================================================

import { PrismaClient } from '@prisma/client';
import togetherAI from '../services/together-ai.service.js';

const prisma = new PrismaClient();

const CONTEXT_WINDOW_SIZE = 50; // Últimas 50 mensagens como contexto

// ── POST /api/v1/ai/chat/:companionId/message ────────────────

export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { companionId } = req.params;
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Mensagem não pode estar vazia.' });
        }

        if (message.length > 2000) {
            return res.status(400).json({ success: false, message: 'Mensagem muito longa (máx. 2000 caracteres).' });
        }

        // 1. Verificar que o companion existe
        const companion = await prisma.aiCompanion.findUnique({
            where: { id: companionId },
        });

        if (!companion || !companion.isActive) {
            return res.status(404).json({ success: false, message: 'AI Companion não encontrado.' });
        }

        // 2. Verificar subscrição activa
        const subscription = await prisma.aiSubscription.findUnique({
            where: {
                userId_companionId: { userId, companionId },
            },
        });

        if (!subscription || subscription.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Precisas de uma assinatura activa para conversar com este companion.',
                requiresSubscription: true,
            });
        }

        // Verificar se a subscrição não expirou
        if (new Date(subscription.expiresAt) < new Date()) {
            await prisma.aiSubscription.update({
                where: { id: subscription.id },
                data: { status: 'expired' },
            });
            return res.status(403).json({
                success: false,
                message: 'A tua assinatura expirou. Renova para continuar a conversar.',
                requiresSubscription: true,
            });
        }

        // 3. Verificar limite diário de mensagens
        // Reset diário se necessário
        const now = new Date();
        const lastReset = new Date(subscription.lastResetAt);
        const isSameDay = now.toDateString() === lastReset.toDateString();

        if (!isSameDay) {
            await prisma.aiSubscription.update({
                where: { id: subscription.id },
                data: { dailyMsgsUsed: 0, lastResetAt: now },
            });
            subscription.dailyMsgsUsed = 0;
        }

        if (subscription.dailyMsgsUsed >= subscription.dailyMsgLimit) {
            return res.status(429).json({
                success: false,
                message: `Atingiste o limite diário de ${subscription.dailyMsgLimit} mensagens. Faz upgrade do plano para mais.`,
                dailyLimit: subscription.dailyMsgLimit,
                dailyUsed: subscription.dailyMsgsUsed,
            });
        }

        // 4. Buscar ou criar conversa
        let conversation = await prisma.aiConversation.findUnique({
            where: {
                userId_companionId: { userId, companionId },
            },
        });

        if (!conversation) {
            conversation = await prisma.aiConversation.create({
                data: {
                    userId,
                    companionId,
                    title: `Conversa com ${companion.name}`,
                },
            });
        }

        // 5. Buscar histórico recente (context window)
        const recentMessages = await prisma.aiMessage.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'desc' },
            take: CONTEXT_WINDOW_SIZE,
            select: { role: true, content: true },
        });

        // Inverter para ordem cronológica
        recentMessages.reverse();

        // 6. Construir system prompt
        const systemPrompt = togetherAI.buildSystemPrompt(companion, conversation.sessionMemory);

        // 7. Construir array de mensagens para a API
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...recentMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message.trim() },
        ];

        // 8. Guardar mensagem do utilizador
        await prisma.aiMessage.create({
            data: {
                conversationId: conversation.id,
                role: 'user',
                content: message.trim(),
            },
        });

        // 9. Chamar Together AI
        let aiResponse;
        try {
            aiResponse = await togetherAI.chat(apiMessages);
        } catch (aiError) {
            console.error('[AI Chat] Together AI error:', aiError.message);
            return res.status(502).json({
                success: false,
                message: 'Erro ao gerar resposta. Tenta novamente em alguns segundos.',
            });
        }

        // 10. Guardar resposta da AI
        const savedMessage = await prisma.aiMessage.create({
            data: {
                conversationId: conversation.id,
                role: 'assistant',
                content: aiResponse.content,
                tokensUsed: aiResponse.tokensUsed,
                modelUsed: aiResponse.model,
                responseTimeMs: aiResponse.responseTimeMs,
            },
        });

        // 11. Actualizar contadores
        await Promise.all([
            prisma.aiConversation.update({
                where: { id: conversation.id },
                data: {
                    messageCount: { increment: 2 },
                    lastMessageAt: now,
                },
            }),
            prisma.aiSubscription.update({
                where: { id: subscription.id },
                data: { dailyMsgsUsed: { increment: 1 } },
            }),
            prisma.aiCompanion.update({
                where: { id: companionId },
                data: { messageCount: { increment: 2 } },
            }),
        ]);

        // 12. Responder
        res.json({
            success: true,
            data: {
                id: savedMessage.id,
                role: 'assistant',
                content: aiResponse.content,
                tokensUsed: aiResponse.tokensUsed,
                responseTimeMs: aiResponse.responseTimeMs,
                conversationId: conversation.id,
            },
            usage: {
                dailyMsgsUsed: subscription.dailyMsgsUsed + 1,
                dailyMsgLimit: subscription.dailyMsgLimit,
            },
        });
    } catch (error) {
        console.error('[AI Chat] Erro:', error);
        res.status(500).json({ success: false, message: 'Erro ao processar mensagem.' });
    }
};

// ── GET /api/v1/ai/chat/:companionId/history ─────────────────

export const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { companionId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = Math.min(parseInt(limit), 100);

        const conversation = await prisma.aiConversation.findUnique({
            where: {
                userId_companionId: { userId, companionId },
            },
            select: { id: true, messageCount: true, companionId: true },
        });

        if (!conversation) {
            return res.json({
                success: true,
                data: [],
                pagination: { page: 1, limit: take, total: 0, pages: 0 },
            });
        }

        const [messages, total] = await Promise.all([
            prisma.aiMessage.findMany({
                where: { conversationId: conversation.id },
                orderBy: { createdAt: 'asc' },
                skip,
                take,
                select: {
                    id: true,
                    role: true,
                    content: true,
                    tokensUsed: true,
                    responseTimeMs: true,
                    createdAt: true,
                },
            }),
            prisma.aiMessage.count({ where: { conversationId: conversation.id } }),
        ]);

        res.json({
            success: true,
            data: messages,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                pages: Math.ceil(total / take),
            },
        });
    } catch (error) {
        console.error('[AI Chat] Erro ao buscar histórico:', error);
        res.status(500).json({ success: false, message: 'Erro ao carregar histórico.' });
    }
};

// ── DELETE /api/v1/ai/chat/:companionId — Limpar conversa ────

export const clearConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { companionId } = req.params;

        const conversation = await prisma.aiConversation.findUnique({
            where: {
                userId_companionId: { userId, companionId },
            },
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversa não encontrada.' });
        }

        // Delete messages and reset conversation
        await prisma.$transaction([
            prisma.aiMessage.deleteMany({
                where: { conversationId: conversation.id },
            }),
            prisma.aiConversation.update({
                where: { id: conversation.id },
                data: {
                    messageCount: 0,
                    sessionMemory: null,
                    lastMessageAt: null,
                },
            }),
        ]);

        res.json({ success: true, message: 'Conversa limpa com sucesso.' });
    } catch (error) {
        console.error('[AI Chat] Erro ao limpar conversa:', error);
        res.status(500).json({ success: false, message: 'Erro ao limpar conversa.' });
    }
};
