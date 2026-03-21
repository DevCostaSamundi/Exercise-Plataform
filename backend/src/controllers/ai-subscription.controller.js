// ============================================================
// AI SUBSCRIPTION CONTROLLER
// Assinar, listar, cancelar assinaturas de AI Companions
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Planos disponíveis
const PLANS = {
    free: { price: 0, dailyMsgLimit: 20, label: 'Free' },
    basic: { price: 9.99, dailyMsgLimit: 200, label: 'Basic' },
    premium: { price: 24.99, dailyMsgLimit: 999999, label: 'Premium' },
    ultra: { price: 49.99, dailyMsgLimit: 999999, label: 'Ultra' },
};

// ── POST /api/v1/ai/subscribe/:companionId ───────────────────

export const subscribe = async (req, res) => {
    try {
        const userId = req.user.id;
        const { companionId } = req.params;
        const { plan = 'basic' } = req.body;

        if (!PLANS[plan]) {
            return res.status(400).json({ success: false, message: 'Plano inválido.' });
        }

        // Verificar companion existe
        const companion = await prisma.aiCompanion.findUnique({
            where: { id: companionId },
            select: { id: true, name: true, monthlyPrice: true, isActive: true },
        });

        if (!companion || !companion.isActive) {
            return res.status(404).json({ success: false, message: 'AI Companion não encontrado.' });
        }

        // Verificar se já tem subscrição
        const existing = await prisma.aiSubscription.findUnique({
            where: { userId_companionId: { userId, companionId } },
        });

        if (existing && existing.status === 'active') {
            return res.status(409).json({
                success: false,
                message: 'Já tens uma assinatura activa para este companion.',
                data: existing,
            });
        }

        const planConfig = PLANS[plan];
        const priceUSD = plan === 'free' ? 0 : companion.monthlyPrice;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Criar ou reactivar subscrição
        const subscription = existing
            ? await prisma.aiSubscription.update({
                where: { id: existing.id },
                data: {
                    plan,
                    status: 'active',
                    priceUSD,
                    dailyMsgLimit: planConfig.dailyMsgLimit,
                    dailyMsgsUsed: 0,
                    lastResetAt: new Date(),
                    startedAt: new Date(),
                    expiresAt,
                    cancelledAt: null,
                },
            })
            : await prisma.aiSubscription.create({
                data: {
                    userId,
                    companionId,
                    plan,
                    priceUSD,
                    dailyMsgLimit: planConfig.dailyMsgLimit,
                    expiresAt,
                },
            });

        // Incrementar contagem de assinantes
        await prisma.aiCompanion.update({
            where: { id: companionId },
            data: { subscriberCount: { increment: 1 } },
        });

        res.status(201).json({
            success: true,
            data: subscription,
            message: `Assinatura ${planConfig.label} activada para ${companion.name}!`,
        });
    } catch (error) {
        console.error('[AI Subscription] Erro ao assinar:', error);
        res.status(500).json({ success: false, message: 'Erro ao processar assinatura.' });
    }
};

// ── GET /api/v1/ai/subscriptions — Minhas assinaturas ────────

export const mySubscriptions = async (req, res) => {
    try {
        const userId = req.user.id;

        const subscriptions = await prisma.aiSubscription.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                companion: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        avatar: true,
                        description: true,
                        tags: true,
                    },
                },
            },
        });

        res.json({ success: true, data: subscriptions });
    } catch (error) {
        console.error('[AI Subscription] Erro ao listar:', error);
        res.status(500).json({ success: false, message: 'Erro ao carregar assinaturas.' });
    }
};

// ── DELETE /api/v1/ai/subscribe/:companionId — Cancelar ──────

export const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { companionId } = req.params;

        const subscription = await prisma.aiSubscription.findUnique({
            where: { userId_companionId: { userId, companionId } },
        });

        if (!subscription || subscription.status !== 'active') {
            return res.status(404).json({ success: false, message: 'Assinatura não encontrada.' });
        }

        await prisma.aiSubscription.update({
            where: { id: subscription.id },
            data: { status: 'cancelled', cancelledAt: new Date() },
        });

        await prisma.aiCompanion.update({
            where: { id: companionId },
            data: { subscriberCount: { decrement: 1 } },
        });

        res.json({ success: true, message: 'Assinatura cancelada.' });
    } catch (error) {
        console.error('[AI Subscription] Erro ao cancelar:', error);
        res.status(500).json({ success: false, message: 'Erro ao cancelar assinatura.' });
    }
};

// ── GET /api/v1/ai/plans — Planos disponíveis ────────────────

export const getPlans = async (req, res) => {
    res.json({
        success: true,
        data: Object.entries(PLANS).map(([key, val]) => ({
            id: key,
            ...val,
        })),
    });
};
