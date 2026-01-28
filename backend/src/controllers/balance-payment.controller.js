import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Create payment using wallet balance
 * POST /api/v1/payments/balance/create
 */
export const createBalancePayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            creatorId,
            type,
            amountUSD,
            subscriptionId,
            postId,
            messageId,
        } = req.body;

        // Validations
        if (!creatorId || !amountUSD || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
        }

        if (amountUSD < 1) {
            return res.status(400).json({
                success: false,
                message: 'Minimum payment is $1',
            });
        }

        // Get user wallet
        const wallet = await prisma.userWallet.findUnique({
            where: { userId },
        });

        if (!wallet || wallet.balanceUSD < amountUSD) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance',
                balance: wallet?.balanceUSD || 0,
                required: amountUSD,
            });
        }

        // Get creator
        const creator = await prisma.creator.findUnique({
            where: { id: creatorId },
        });

        if (!creator) {
            return res.status(404).json({
                success: false,
                message: 'Creator not found',
            });
        }

        // Start transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Deduct from user balance
            await tx.userWallet.update({
                where: { userId },
                data: {
                    balanceUSD: { decrement: amountUSD },
                    totalSpent: { increment: amountUSD },
                },
            });

            // 2. Calculate fees
            const platformFee = parseFloat(amountUSD) * 0.10;
            const netAmount = parseFloat(amountUSD) - platformFee;

            // 3. Create payment record
            const payment = await tx.payment.create({
                data: {
                    userId,
                    creatorId,
                    type,
                    amountUSD: parseFloat(amountUSD),
                    currency: 'USD',
                    status: 'COMPLETED',
                    gateway: 'BALANCE',
                    gatewayOrderId: `bal_${Date.now()}`,
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

            // 4. Add to creator balance
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

            // 5. Process based on type
            if (type === 'SUBSCRIPTION' || type === 'SUBSCRIPTION_RENEWAL') {
                if (subscriptionId) {
                    // Renew existing
                    await tx.subscription.update({
                        where: { id: subscriptionId },
                        data: {
                            status: 'ACTIVE',
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        },
                    });
                } else {
                    // Create new
                    await tx.subscription.create({
                        data: {
                            userId,
                            creatorId,
                            status: 'ACTIVE',
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            amount: parseFloat(amountUSD),
                            paymentMethod: 'BALANCE',
                        },
                    });
                }
            }

            // 6. Create notifications
            await tx.notification.createMany({
                data: [
                    {
                        userId,
                        type: 'PAYMENT',
                        title: 'Payment Successful',
                        message: `You paid $${amountUSD} from your balance`,
                        metadata: { paymentId: payment.id },
                    },
                    {
                        userId: creatorId,
                        type: 'PAYMENT',
                        title: 'Payment Received',
                        message: `You received $${netAmount.toFixed(2)} from a ${type.toLowerCase()}`,
                        metadata: { paymentId: payment.id },
                    },
                ],
            });

            return payment;
        });

        logger.info('✅ Balance payment completed:', {
            paymentId: result.id,
            userId,
            creatorId,
            amountUSD,
        });

        res.json({
            success: true,
            message: 'Payment successful',
            data: {
                paymentId: result.id,
                amountUSD: result.amountUSD,
                status: result.status,
            },
        });

    } catch (error) {
        logger.error('Balance payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment failed',
            error: error.message,
        });
    }
};

export default {
    createBalancePayment,
};