import cron from 'node-cron';
import prisma from '../config/database.js';
import web3Service from '../services/web3.service.js';
import logger from '../utils/logger.js';

/**
 * Blockchain Monitor Job
 * Monitors pending payments and confirms them when blockchain confirmations are received
 * Runs every 30 seconds
 */

let isRunning = false;

async function monitorPendingPayments() {
    // Prevent concurrent runs
    if (isRunning) {
        logger.debug('Blockchain monitor already running, skipping...');
        return;
    }

    isRunning = true;

    try {
        // Find payments that are waiting for confirmation
        const pendingPayments = await prisma.payment.findMany({
            where: {
                status: {
                    in: ['WAITING', 'CONFIRMING'],
                },
                web3TxHash: {
                    not: null,
                },
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        payoutWallet: true,
                        displayName: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                    },
                },
            },
            take: 50, // Process max 50 at a time
        });

        if (pendingPayments.length === 0) {
            logger.debug('No pending payments to monitor');
            return;
        }

        logger.info(`Monitoring ${pendingPayments.length} pending payments`);

        for (const payment of pendingPayments) {
            try {
                await verifyAndConfirmPayment(payment);
            } catch (error) {
                logger.error(`Error processing payment ${payment.id}:`, error);
                // Continue with next payment
            }
        }
    } catch (error) {
        logger.error('Error in blockchain monitor:', error);
    } finally {
        isRunning = false;
    }
}

/**
 * Verify and confirm a single payment
 */
async function verifyAndConfirmPayment(payment) {
    const { id, web3TxHash, amountUSD, creator, user, type, subscriptionId } = payment;

    logger.info(`Verifying payment ${id}, tx: ${web3TxHash}`);

    try {
        // Get transaction receipt
        const receipt = await web3Service.getTransactionReceipt(web3TxHash);

        if (!receipt) {
            logger.warn(`Transaction ${web3TxHash} not found yet`);
            return;
        }

        // Check if transaction failed
        if (receipt.status === 0) {
            logger.error(`Transaction ${web3TxHash} failed on-chain`);

            await prisma.payment.update({
                where: { id },
                data: {
                    status: 'FAILED',
                    updatedAt: new Date(),
                },
            });

            // TODO: Send notification to user
            return;
        }

        // Get current confirmations
        const currentBlock = await web3Service.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber;

        logger.info(`Payment ${id} has ${confirmations} confirmations`);

        // Update confirmations
        await prisma.payment.update({
            where: { id },
            data: {
                web3Confirmations: confirmations,
                web3BlockNumber: receipt.blockNumber,
            },
        });

        // Check if we have enough confirmations
        const requiredConfirmations = parseInt(process.env.CONFIRMATIONS_REQUIRED || '2');

        if (confirmations < requiredConfirmations) {
            // Update status to CONFIRMING if not already
            if (payment.status !== 'CONFIRMING') {
                await prisma.payment.update({
                    where: { id },
                    data: {
                        status: 'CONFIRMING',
                    },
                });
            }
            return;
        }

        // Verify payment on-chain
        const verification = await web3Service.verifyPayment(
            web3TxHash,
            parseFloat(amountUSD),
            creator.payoutWallet
        );

        if (!verification.valid) {
            logger.error(`Payment verification failed for ${id}:`, verification.error);

            await prisma.payment.update({
                where: { id },
                data: {
                    status: 'FAILED',
                    metadata: {
                        verificationError: verification.error,
                    },
                },
            });

            return;
        }

        // Payment is confirmed! Process it
        logger.info(`✅ Payment ${id} confirmed on-chain!`);

        await processConfirmedPayment(payment, verification.event);

    } catch (error) {
        logger.error(`Error verifying payment ${id}:`, error);
        throw error;
    }
}

/**
 * Process a confirmed payment
 */
async function processConfirmedPayment(payment, eventData) {
    const { id, type, subscriptionId, creatorId, userId, amountUSD } = payment;

    try {
        // Start a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Update payment status
            await tx.payment.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    confirmedAt: new Date(),
                    paidAt: new Date(),
                },
            });

            // 2. Calculate amounts
            const platformFee = parseFloat(amountUSD) * 0.10; // 10%
            const creatorAmount = parseFloat(amountUSD) - platformFee;

            // 3. Update creator balance
            await tx.creatorBalance.upsert({
                where: { creatorId },
                create: {
                    creatorId,
                    availableUSD: creatorAmount,
                    lifetimeEarnings: creatorAmount,
                    lastPaymentAt: new Date(),
                },
                update: {
                    availableUSD: {
                        increment: creatorAmount,
                    },
                    lifetimeEarnings: {
                        increment: creatorAmount,
                    },
                    lastPaymentAt: new Date(),
                },
            });

            // 4. Handle based on payment type
            if (type === 'SUBSCRIPTION' || type === 'SUBSCRIPTION_RENEWAL') {
                if (subscriptionId) {
                    // Activate subscription
                    await tx.subscription.update({
                        where: { id: subscriptionId },
                        data: {
                            status: 'ACTIVE',
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                        },
                    });

                    logger.info(`Subscription ${subscriptionId} activated`);
                }
            }

            // 5. Create notification for creator
            await tx.notification.create({
                data: {
                    userId: creatorId,
                    type: 'PAYMENT',
                    title: 'Payment Received',
                    message: `You received $${creatorAmount.toFixed(2)} USDC from a ${type.toLowerCase()}`,
                    metadata: {
                        paymentId: id,
                        amount: creatorAmount,
                        type,
                    },
                },
            });

            // 6. Create notification for user
            await tx.notification.create({
                data: {
                    userId,
                    type: 'PAYMENT',
                    title: 'Payment Confirmed',
                    message: `Your payment of $${amountUSD} has been confirmed`,
                    metadata: {
                        paymentId: id,
                        amount: amountUSD,
                        type,
                    },
                },
            });

            logger.info(`✅ Payment ${id} processed successfully`);
        });

        // TODO: Send email notifications
        // TODO: Emit socket.io event for real-time updates

    } catch (error) {
        logger.error(`Error processing confirmed payment ${id}:`, error);
        throw error;
    }
}

/**
 * Start the blockchain monitor
 */
export function startBlockchainMonitor() {
    logger.info('Starting blockchain monitor...');

    // Run every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
        await monitorPendingPayments();
    });

    logger.info('✅ Blockchain monitor started (runs every 30 seconds)');
}

/**
 * Manual trigger for testing
 */
export async function triggerMonitor() {
    logger.info('Manually triggering blockchain monitor...');
    await monitorPendingPayments();
}

export default {
    startBlockchainMonitor,
    triggerMonitor,
};
