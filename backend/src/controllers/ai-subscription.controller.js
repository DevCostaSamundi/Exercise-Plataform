// ============================================================
// AI SUBSCRIPTION CONTROLLER
// Assinar, listar, cancelar assinaturas de AI Companions
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: verifica e debita saldo USDC da wallet do utilizador
async function chargeWallet(tx, userId, amountUSD) {
    const wallet = await tx.userWallet.findUnique({ where: { userId } });

    if (!wallet) {
        throw new Error('WALLET_NOT_FOUND');
    }

    const currentBalance = parseFloat(wallet.balanceUSD.toString());
    if (currentBalance < amountUSD) {
        throw new Error(`INSUFFICIENT_BALANCE:${currentBalance.toFixed(2)}`);
    }

    await tx.userWallet.update({
        where: { userId },
        data: {
            balanceUSD: { decrement: amountUSD },
            totalSpent: { increment: amountUSD },
        },
    });
}

// Planos disponíveis
const PLANS = {
    free: { price: 0, dailyMsgLimit: 20, label: 'Free' },
    basic: { price: 9.99, dailyMsgLimit: 200, label: 'Basic' },
    premium: { price: 24.99, dailyMsgLimit: 999999, label: 'Premium' },
    ultra: { price: 49.99, dailyMsgLimit: 999999, label: 'Ultra' },
};

// ── POST /api/v1/ai/subscribe/:companionId ───────────────────

export const subscribe = async (req, res) => {
    let priceUSD = 0;
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
        priceUSD = plan === 'free' ? 0 : companion.monthlyPrice;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Executar em transação: verificar pagamento e criar subscrição atomicamente
        const subscription = await prisma.$transaction(async (tx) => {
            // Verificar e debitar saldo USDC para planos pagos
            if (priceUSD > 0) {
                await chargeWallet(tx, userId, priceUSD);
            }

            // Criar ou reactivar subscrição
            const sub = existing
                ? await tx.aiSubscription.update({
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
                : await tx.aiSubscription.create({
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
            await tx.aiCompanion.update({
                where: { id: companionId },
                data: { subscriberCount: { increment: 1 } },
            });

            return sub;
        });

        res.status(201).json({
            success: true,
            data: subscription,
            message: `Assinatura ${planConfig.label} activada para ${companion.name}!`,
        });
    } catch (error) {
        if (error.message === 'WALLET_NOT_FOUND') {
            return res.status(402).json({ success: false, message: 'Carteira não encontrada. Configura a tua wallet para assinar planos pagos.' });
        }

        if (error.message?.startsWith('INSUFFICIENT_BALANCE:')) {
            const balance = error.message.split(':')[1];
            return res.status(402).json({
                success: false,
                message: 'Saldo USDC insuficiente para activar este plano.',
                data: { currentBalance: parseFloat(balance), required: priceUSD },
            });
        }

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
