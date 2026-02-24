import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Balance Payment Controller — FlowConnect
 * Pagamentos usando saldo interno da plataforma (USDC depositado)
 *
 * POST /api/v1/payments/balance/create
 */
export const createBalancePayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { creatorId, type, amountUSD, subscriptionId, postId, messageId } = req.body;

        // Validações básicas
        if (!creatorId || !amountUSD || !type) {
            return res.status(400).json({
                success: false,
                message: 'creatorId, amountUSD e type são obrigatórios',
            });
        }

        if (amountUSD < 1) {
            return res.status(400).json({ success: false, message: 'Valor mínimo é $1' });
        }

        if (amountUSD > 10000) {
            return res.status(400).json({ success: false, message: 'Valor máximo é $10.000' });
        }

        const validTypes = ['SUBSCRIPTION', 'SUBSCRIPTION_RENEWAL', 'TIP', 'PPV_MESSAGE', 'PPV_POST'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, message: 'Tipo de pagamento inválido' });
        }

        // Impede pagamento para si mesmo
        const creator = await prisma.creator.findUnique({
            where: { id: creatorId },
            select: { id: true, userId: true, displayName: true },
        });

        if (!creator) {
            return res.status(404).json({ success: false, message: 'Criador não encontrado' });
        }

        if (creator.userId === userId) {
            return res.status(400).json({ success: false, message: 'Você não pode pagar a si mesmo' });
        }

        // Executa em transação atômica
        const result = await prisma.$transaction(async (tx) => {
            // Busca carteira com lock (evita race conditions em pagamentos simultâneos)
            const wallet = await tx.userWallet.findUnique({
                where: { userId },
            });

            if (!wallet) {
                throw new Error('WALLET_NOT_FOUND');
            }

            const currentBalance = parseFloat(wallet.balanceUSD.toString());
            const amount = parseFloat(amountUSD);

            if (currentBalance < amount) {
                throw new Error(`INSUFFICIENT_BALANCE:${currentBalance.toFixed(2)}`);
            }

            // Calcula taxas
            const platformFee = amount * 0.10;
            const netAmount = amount - platformFee;

            // 1. Debita saldo do usuário
            await tx.userWallet.update({
                where: { userId },
                data: {
                    balanceUSD: { decrement: amount },
                    totalSpent: { increment: amount },
                },
            });

            // 2. Cria registro de pagamento
            const payment = await tx.payment.create({
                data: {
                    userId,
                    creatorId,
                    type,
                    amountUSD: amount,
                    currency: 'USD',
                    status: 'COMPLETED',
                    gateway: 'BALANCE',
                    gatewayOrderId: `bal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    platformFee,
                    gatewayFee: 0,
                    netAmount,
                    subscriptionId,
                    postId,
                    messageId,
                    confirmedAt: new Date(),
                    paidAt: new Date(),
                },
            });

            // 3. Credita saldo do criador
            await tx.creatorBalance.upsert({
                where: { creatorId },
                create: {
                    creatorId,
                    availableUSD: netAmount,
                    lifetimeEarnings: netAmount,
                    lastPaymentAt: new Date(),
                },
                update: {
                    availableUSD: { increment: netAmount },
                    lifetimeEarnings: { increment: netAmount },
                    lastPaymentAt: new Date(),
                },
            });

            // 4. Libera conteúdo baseado no tipo
            if (type === 'SUBSCRIPTION' || type === 'SUBSCRIPTION_RENEWAL') {
                if (subscriptionId) {
                    await tx.subscription.update({
                        where: { id: subscriptionId },
                        data: {
                            status: 'ACTIVE',
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            renewedAt: new Date(),
                        },
                    });
                } else {
                    await tx.subscription.create({
                        data: {
                            userId,
                            creatorId,
                            status: 'ACTIVE',
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            amount,
                            paymentMethod: 'BALANCE',
                        },
                    });
                }
            } else if (type === 'PPV_POST' && postId) {
                await tx.postAccess.upsert({
                    where: { userId_postId: { userId, postId } },
                    create: { userId, postId, grantedAt: new Date(), paymentId: payment.id },
                    update: { grantedAt: new Date() },
                });
            } else if (type === 'PPV_MESSAGE' && messageId) {
                await tx.message.update({
                    where: { id: messageId },
                    data: { isUnlocked: true, unlockedAt: new Date() },
                });
            }

            // 5. Notificações
            await tx.notification.createMany({
                data: [
                    {
                        userId,
                        type: 'PAYMENT_CONFIRMED',
                        title: 'Pagamento realizado! ✅',
                        message: `$${amount.toFixed(2)} USDC pago com seu saldo.`,
                        metadata: { paymentId: payment.id },
                    },
                    {
                        userId: creator.userId,
                        type: 'PAYMENT_RECEIVED',
                        title: 'Você recebeu um pagamento! 💰',
                        message: `$${netAmount.toFixed(2)} USDC recebidos de um ${type.toLowerCase()}.`,
                        metadata: { paymentId: payment.id },
                    },
                ],
            });

            return { payment, newBalance: currentBalance - amount };
        });

        logger.info('✅ Pagamento via saldo concluído:', {
            paymentId: result.payment.id,
            userId,
            creatorId,
            amountUSD,
        });

        res.json({
            success: true,
            message: 'Pagamento realizado com sucesso!',
            data: {
                paymentId: result.payment.id,
                amountUSD: result.payment.amountUSD,
                status: result.payment.status,
                newBalance: result.newBalance.toFixed(2),
            },
        });

    } catch (error) {
        logger.error('Erro no pagamento via saldo:', error);

        if (error.message === 'WALLET_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Carteira não encontrada' });
        }

        if (error.message?.startsWith('INSUFFICIENT_BALANCE:')) {
            const balance = error.message.split(':')[1];
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente',
                data: { currentBalance: parseFloat(balance), required: req.body.amountUSD },
            });
        }

        res.status(500).json({ success: false, message: 'Falha no pagamento', error: error.message });
    }
};

export default { createBalancePayment };