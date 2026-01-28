import { createPublicClient, http, parseAbiItem } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Alchemy Webhook Service
 * Monitora eventos do smart contract via Alchemy Notify
 */
class AlchemyWebhookService {
    constructor() {
        const network = process.env.NODE_ENV === 'production' ? polygon : polygonAmoy;
        
        this.client = createPublicClient({
            chain: network,
            transport: http(process.env.POLYGON_RPC_URL),
        });

        this.contractAddress = process.env.PAYMENT_CONTRACT_ADDRESS;
    }

    /**
     * Processar evento PaymentReceived do Alchemy
     */
    async processPaymentEvent(event) {
        try {
            const {
                transaction: { hash: txHash },
                log: { topics, data },
            } = event;

            logger.info('📩 Payment event received:', { txHash });

            // Decode event data
            const decodedEvent = this.decodePaymentEvent(topics, data);
            
            const {
                payer,
                creator,
                orderId,
                totalAmount,
                creatorAmount,
                platformFee,
            } = decodedEvent;

            // Buscar payment no banco
            const payment = await prisma.payment.findFirst({
                where: {
                    gatewayOrderId: orderId,
                    status: 'PENDING',
                },
            });

            if (!payment) {
                logger.error(`Payment not found for order: ${orderId}`);
                return { success: false };
            }

            // Verificar valores
            const expectedAmount = payment.amountUSD * 1e6; // Convert to USDC decimals
            if (Math.abs(totalAmount - expectedAmount) > 1000) { // 0.001 USDC tolerance
                logger.error('Amount mismatch:', {
                    expected: expectedAmount,
                    received: totalAmount,
                });
                return { success: false };
            }

            // Atualizar payment
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'COMPLETED',
                    web3TxHash: txHash,
                    confirmedAt: new Date(),
                    paidAt: new Date(),
                    cryptoAmount: (totalAmount / 1e6).toString(),
                    web3Verified: true,
                },
            });

            // Processar baseado no tipo
            await this.processPaymentType(payment, creatorAmount, platformFee);

            logger.info('✅ Payment processed:', {
                paymentId: payment.id,
                orderId,
                txHash,
            });

            return { success: true };

        } catch (error) {
            logger.error('Error processing payment event:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Decode PaymentReceived event
     */
    decodePaymentEvent(topics, data) {
        // Event signature: PaymentReceived(address,address,string,uint256,uint256,uint256,uint256)
        const [, payerTopic, creatorTopic] = topics;
        
        const payer = `0x${payerTopic.slice(26)}`;
        const creator = `0x${creatorTopic.slice(26)}`;
        
        // Decode data (orderId, amounts, timestamp)
        // Simplified - use proper ABI decoding in production
        const values = this.client.decodeEventLog({
            abi: [{
                type: 'event',
                name: 'PaymentReceived',
                inputs: [
                    { name: 'payer', type: 'address', indexed: true },
                    { name: 'creator', type: 'address', indexed: true },
                    { name: 'orderId', type: 'string' },
                    { name: 'totalAmount', type: 'uint256' },
                    { name: 'creatorAmount', type: 'uint256' },
                    { name: 'platformFee', type: 'uint256' },
                    { name: 'timestamp', type: 'uint256' },
                ],
            }],
            data,
            topics,
        });

        return {
            payer,
            creator,
            orderId: values.args.orderId,
            totalAmount: Number(values.args.totalAmount),
            creatorAmount: Number(values.args.creatorAmount),
            platformFee: Number(values.args.platformFee),
            timestamp: Number(values.args.timestamp),
        };
    }

    /**
     * Processar pagamento baseado no tipo
     */
    async processPaymentType(payment, creatorAmount, platformFee) {
        const { type, userId, creatorId, subscriptionId } = payment;

        try {
            // Atualizar saldo do creator
            await prisma.creatorBalance.upsert({
                where: { creatorId },
                create: {
                    creatorId,
                    availableUSD: creatorAmount / 1e6,
                    lifetimeEarnings: creatorAmount / 1e6,
                    lastPaymentAt: new Date(),
                },
                update: {
                    availableUSD: { increment: creatorAmount / 1e6 },
                    lifetimeEarnings: { increment: creatorAmount / 1e6 },
                    lastPaymentAt: new Date(),
                },
            });

            // Se for subscription
            if (type === 'SUBSCRIPTION' || type === 'SUBSCRIPTION_RENEWAL') {
                if (subscriptionId) {
                    await prisma.subscription.update({
                        where: { id: subscriptionId },
                        data: {
                            status: 'ACTIVE',
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        },
                    });
                } else {
                    // Criar nova subscription
                    await prisma.subscription.create({
                        data: {
                            userId,
                            creatorId,
                            status: 'ACTIVE',
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            amount: payment.amountUSD,
                            paymentMethod: 'CRYPTO',
                        },
                    });
                }
            }

            // TODO: Enviar notificações

            logger.info('Payment type processed:', { type, userId, creatorId });

        } catch (error) {
            logger.error('Error processing payment type:', error);
            throw error;
        }
    }

    /**
     * Validar webhook signature do Alchemy
     */
    validateAlchemySignature(body, signature) {
        const crypto = require('crypto');
        const signingKey = process.env.ALCHEMY_SIGNING_KEY;
        
        const hmac = crypto
            .createHmac('sha256', signingKey)
            .update(JSON.stringify(body))
            .digest('hex');
        
        return hmac === signature;
    }
}

export default new AlchemyWebhookService();