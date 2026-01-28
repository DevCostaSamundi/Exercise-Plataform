import axios from 'axios';
import crypto from 'crypto';
import web3Config from '../config/web3.config.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Transak Service
 * Handles Transak on-ramp integration (FIAT → USDC)
 */
class TransakService {
    constructor() {
        this.apiKey = web3Config.transak.apiKey;
        this.apiUrl = web3Config.transak.apiUrl;
        this.environment = web3Config.transak.environment;
        this.webhookSecret = web3Config.transak.webhookSecret;

        // Check if configured
        this.isConfigured = !!(this.apiKey && this.apiKey !== 'your_transak_api_key');

        if (this.isConfigured) {
            this.client = axios.create({
                baseURL: this.apiUrl,
                headers: {
                    'access-token': this.apiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            });
            logger.info('✅ Transak service initialized');
        } else {
            logger.warn('⚠️ Transak NOT configured - Some features will be limited');
        }
    }

    /**
     * Get widget configuration for frontend
     */
    getWidgetConfig({
        walletAddress,
        email,
        cryptoAmount,
        fiatAmount,
        fiatCurrency = 'USD',
        orderId,
    }) {
        const config = {
            apiKey: this.apiKey,
            environment: this.environment,

            // User
            walletAddress,
            email,

            // Transaction
            cryptoCurrencyCode: web3Config.transak.defaultCrypto,
            network: web3Config.transak.defaultNetwork,
            fiatCurrency,

            // Amount (one or the other)
            ...(cryptoAmount && { cryptoAmount }),
            ...(fiatAmount && { fiatAmount }),

            // Payment methods
            defaultPaymentMethod: fiatCurrency === 'BRL' ? 'pix' : 'credit_debit_card',

            // Customization
            themeColor: '7c3aed', // Purple
            hideMenu: true,
            disableWalletAddressForm: true,

            // Callbacks
            webhookUrl: `${process.env.WEBHOOK_URL}/payments/webhook/transak`,
            redirectURL: `${process.env.SUCCESS_URL}?orderId=${orderId}`,

            // Metadata
            partnerCustomerId: orderId,
            partnerOrderId: orderId,
        };

        return config;
    }

    /**
     * Validate Transak webhook signature
     */
    validateWebhookSignature(payload, signature) {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');

            return signature === expectedSignature;
        } catch (error) {
            logger.error('Error validating Transak signature:', error);
            return false;
        }
    }

    /**
     * Process Transak webhook
     */
    async processWebhook(payload, signature) {
        try {
            // Validate signature
            if (!this.validateWebhookSignature(payload, signature)) {
                logger.error('❌ Invalid Transak webhook signature');
                return {
                    success: false,
                    error: 'Invalid signature',
                };
            }

            const { eventName, data } = payload;

            logger.info(`📩 Transak webhook: ${eventName}`, {
                orderId: data.partnerOrderId,
                status: data.status,
            });

            // Handle different events
            switch (eventName) {
                case 'ORDER_CREATED':
                    return await this.handleOrderCreated(data);

                case 'ORDER_PROCESSING':
                    return await this.handleOrderProcessing(data);

                case 'ORDER_COMPLETED':
                    return await this.handleOrderCompleted(data);

                case 'ORDER_FAILED':
                    return await this.handleOrderFailed(data);

                case 'ORDER_CANCELLED':
                    return await this.handleOrderCancelled(data);

                default:
                    logger.info(`Unhandled Transak event: ${eventName}`);
                    return { success: true };
            }
        } catch (error) {
            logger.error('Error processing Transak webhook:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Handle ORDER_CREATED event
     */
    async handleOrderCreated(data) {
        const { partnerOrderId, id: transakOrderId } = data;

        try {
            // Find payment
            const payment = await prisma.payment.findFirst({
                where: {
                    gatewayOrderId: partnerOrderId,
                    gateway: 'TRANSAK',
                },
            });

            if (!payment) {
                logger.error(`Payment not found for order: ${partnerOrderId}`);
                return { success: false };
            }

            // Update with Transak order ID
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'WAITING',
                    gatewayData: {
                        ...payment.gatewayData,
                        transakOrderId,
                        eventData: data,
                    },
                },
            });

            logger.info(`Order created: ${partnerOrderId}`);
            return { success: true };
        } catch (error) {
            logger.error('Error handling ORDER_CREATED:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle ORDER_PROCESSING event
     */
    async handleOrderProcessing(data) {
        const { partnerOrderId } = data;

        try {
            const payment = await prisma.payment.findFirst({
                where: {
                    gatewayOrderId: partnerOrderId,
                    gateway: 'TRANSAK',
                },
            });

            if (!payment) {
                return { success: false };
            }

            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'WAITING',
                    gatewayData: {
                        ...payment.gatewayData,
                        eventData: data,
                    },
                },
            });

            logger.info(`Order processing: ${partnerOrderId}`);
            return { success: true };
        } catch (error) {
            logger.error('Error handling ORDER_PROCESSING:', error);
            return { success: false };
        }
    }

    /**
     * Handle ORDER_COMPLETED event (IMPORTANT!)
     */
    async handleOrderCompleted(data) {
        const {
            partnerOrderId,
            cryptoAmount,
            cryptoCurrency,
            network,
            walletAddress,
            transactionHash,
        } = data;

        try {
            logger.info(`🎉 Order completed: ${partnerOrderId}`, {
                cryptoAmount,
                cryptoCurrency,
                network,
                txHash: transactionHash,
            });

            // Find payment
            const payment = await prisma.payment.findFirst({
                where: {
                    gatewayOrderId: partnerOrderId,
                    gateway: 'TRANSAK',
                },
            });

            if (!payment) {
                logger.error(`Payment not found: ${partnerOrderId}`);
                return { success: false };
            }

            // Update payment with transaction hash
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'CONFIRMING',
                    web3TxHash: transactionHash,
                    cryptoCurrency: cryptoCurrency,
                    cryptoAmount: cryptoAmount.toString(),
                    cryptoAddress: walletAddress,
                    gatewayData: {
                        ...payment.gatewayData,
                        eventData: data,
                        completedAt: new Date().toISOString(),
                    },
                },
            });

            // The blockchain-monitor.job.js will now pick this up
            // and verify the on-chain transaction

            logger.info(`Payment ${payment.id} updated with tx: ${transactionHash}`);

            return { success: true };
        } catch (error) {
            logger.error('Error handling ORDER_COMPLETED:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle ORDER_FAILED event
     */
    async handleOrderFailed(data) {
        const { partnerOrderId, statusMessage } = data;

        try {
            const payment = await prisma.payment.findFirst({
                where: {
                    gatewayOrderId: partnerOrderId,
                    gateway: 'TRANSAK',
                },
            });

            if (!payment) {
                return { success: false };
            }

            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'FAILED',
                    gatewayData: {
                        ...payment.gatewayData,
                        eventData: data,
                        failureReason: statusMessage,
                    },
                },
            });

            logger.warn(`Order failed: ${partnerOrderId} - ${statusMessage}`);

            // TODO: Send notification to user

            return { success: true };
        } catch (error) {
            logger.error('Error handling ORDER_FAILED:', error);
            return { success: false };
        }
    }

    /**
     * Handle ORDER_CANCELLED event
     */
    async handleOrderCancelled(data) {
        const { partnerOrderId } = data;

        try {
            const payment = await prisma.payment.findFirst({
                where: {
                    gatewayOrderId: partnerOrderId,
                    gateway: 'TRANSAK',
                },
            });

            if (!payment) {
                return { success: false };
            }

            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'CANCELLED',
                    gatewayData: {
                        ...payment.gatewayData,
                        eventData: data,
                    },
                },
            });

            logger.info(`Order cancelled: ${partnerOrderId}`);
            return { success: true };
        } catch (error) {
            logger.error('Error handling ORDER_CANCELLED:', error);
            return { success: false };
        }
    }

    /**
     * Get order status from Transak API
     */
    async getOrderStatus(transakOrderId) {
        if (!this.isConfigured) {
            return null;
        }

        try {
            const response = await this.client.get(`/partners/order/${transakOrderId}`);
            return response.data;
        } catch (error) {
            logger.error(`Error getting Transak order status:`, error);
            return null;
        }
    }
}

// Export singleton
const transakService = new TransakService();
export default transakService;