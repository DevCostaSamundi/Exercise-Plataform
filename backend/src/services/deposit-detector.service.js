import { createPublicClient, http, formatUnits } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Deposit Detector Service
 * Monitors USDC deposits to user wallets
 */
class DepositDetectorService {
    constructor() {
        const network = process.env.NODE_ENV === 'production' ? polygon : polygonAmoy;
        
        this.client = createPublicClient({
            chain: network,
            transport: http(process.env.POLYGON_RPC_URL),
        });

        this.usdcAddress = process.env.USDC_ADDRESS_POLYGON;
        this.isMonitoring = false;
    }

    /**
     * Start monitoring deposits via Alchemy webhook
     * This is called when webhook receives USDC transfer events
     */
    async processDepositEvent(event) {
        try {
            const {
                transaction: { hash: txHash },
                log: { topics, data },
            } = event;

            logger.info('💰 Deposit event received:', { txHash });

            // Decode Transfer event
            // Transfer(address indexed from, address indexed to, uint256 value)
            const [, fromTopic, toTopic] = topics;
            
            const to = `0x${toTopic.slice(26)}`.toLowerCase();
            
            // Decode amount
            const amount = BigInt(data);
            const amountUSD = Number(formatUnits(amount, 6));

            // Find user with this wallet
            const user = await prisma.user.findUnique({
                where: { web3Wallet: to },
                include: {
                    wallet: true,
                },
            });

            if (!user) {
                logger.warn('Deposit to unknown wallet:', { to, amountUSD });
                return { success: false };
            }

            // Check if deposit already processed
            const existingDeposit = await prisma.payment.findFirst({
                where: {
                    web3TxHash: txHash,
                    type: 'WALLET_DEPOSIT',
                },
            });

            if (existingDeposit) {
                logger.info('Deposit already processed:', { txHash });
                return { success: true };
            }

            // Create deposit record
            const deposit = await prisma.payment.create({
                data: {
                    userId: user.id,
                    type: 'WALLET_DEPOSIT',
                    amountUSD: amountUSD,
                    currency: 'USDC',
                    cryptoCurrency: 'USDC',
                    cryptoAmount: amount.toString(),
                    cryptoAddress: to,
                    status: 'COMPLETED',
                    gateway: 'WEB3_DIRECT',
                    web3TxHash: txHash,
                    web3Confirmations: 2,
                    confirmedAt: new Date(),
                    paidAt: new Date(),
                },
            });

            // Update user wallet balance
            await prisma.userWallet.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    balanceUSD: amountUSD,
                    totalDeposited: amountUSD,
                },
                update: {
                    balanceUSD: { increment: amountUSD },
                    totalDeposited: { increment: amountUSD },
                },
            });

            logger.info('✅ Deposit processed:', {
                userId: user.id,
                amountUSD,
                txHash,
                newBalance: user.wallet ? user.wallet.balanceUSD + amountUSD : amountUSD,
            });

            // Send notification
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: 'PAYMENT',
                    title: 'Deposit Received',
                    message: `$${amountUSD.toFixed(2)} USDC has been added to your balance`,
                    metadata: {
                        depositId: deposit.id,
                        txHash,
                        amount: amountUSD,
                    },
                },
            });

            return { success: true, deposit };

        } catch (error) {
            logger.error('Error processing deposit:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get deposit address for user (their wallet)
     */
    async getDepositAddress(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    web3Wallet: true,
                },
            });

            if (!user || !user.web3Wallet) {
                throw new Error('User wallet not configured');
            }

            return {
                address: user.web3Wallet,
                currency: 'USDC',
                network: 'Polygon',
                minAmount: 1, // $1 minimum
            };
        } catch (error) {
            logger.error('Error getting deposit address:', error);
            throw error;
        }
    }

    /**
     * Get deposit instructions for user
     */
    getDepositInstructions(address) {
        return {
            steps: [
                {
                    step: 1,
                    title: 'Buy USDC',
                    description: 'Purchase USDC on any exchange (Binance, Coinbase, etc.)',
                },
                {
                    step: 2,
                    title: 'Select Polygon Network',
                    description: 'When withdrawing, make sure to select Polygon (not Ethereum)',
                },
                {
                    step: 3,
                    title: 'Send to Your Address',
                    description: `Send USDC to: ${address}`,
                },
                {
                    step: 4,
                    title: 'Wait for Confirmation',
                    description: 'Your balance will update in 1-2 minutes',
                },
            ],
            warnings: [
                'Only send USDC on Polygon network',
                'Sending on other networks will result in loss of funds',
                'Minimum deposit: $1 USDC',
                'Deposits are instant (1-2 minutes)',
            ],
            exchanges: [
                {
                    name: 'Binance',
                    url: 'https://www.binance.com',
                    supported: true,
                    recommended: true,
                },
                {
                    name: 'Coinbase',
                    url: 'https://www.coinbase.com',
                    supported: true,
                },
                {
                    name: 'KuCoin',
                    url: 'https://www.kucoin.com',
                    supported: true,
                },
            ],
        };
    }

    /**
     * Get user's deposit history
     */
    async getDepositHistory(userId, limit = 20) {
        try {
            const deposits = await prisma.payment.findMany({
                where: {
                    userId,
                    type: 'WALLET_DEPOSIT',
                    status: 'COMPLETED',
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
                select: {
                    id: true,
                    amountUSD: true,
                    cryptoCurrency: true,
                    web3TxHash: true,
                    confirmedAt: true,
                    createdAt: true,
                },
            });

            return deposits;
        } catch (error) {
            logger.error('Error getting deposit history:', error);
            throw error;
        }
    }

    /**
     * Validate USDC balance before payment
     */
    async validateBalance(userId, requiredAmount) {
        try {
            const wallet = await prisma.userWallet.findUnique({
                where: { userId },
            });

            if (!wallet) {
                return {
                    valid: false,
                    balance: 0,
                    required: requiredAmount,
                    message: 'Wallet not found',
                };
            }

            const hasEnough = wallet.balanceUSD >= requiredAmount;

            return {
                valid: hasEnough,
                balance: wallet.balanceUSD,
                required: requiredAmount,
                shortage: hasEnough ? 0 : requiredAmount - wallet.balanceUSD,
                message: hasEnough
                    ? 'Sufficient balance'
                    : `Insufficient balance. Need $${(requiredAmount - wallet.balanceUSD).toFixed(2)} more`,
            };
        } catch (error) {
            logger.error('Error validating balance:', error);
            throw error;
        }
    }
}

export default new DepositDetectorService();