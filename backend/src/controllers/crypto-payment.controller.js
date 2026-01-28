import prisma from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { createPublicClient, http, formatUnits } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';

/**
 * Crypto Payment Controller
 * Handles pure crypto payments (no fiat on-ramp)
 */

const network = process.env.NODE_ENV === 'production' ? polygon : polygonAmoy;
const publicClient = createPublicClient({
    chain: network,
    transport: http(process.env.POLYGON_RPC_URL),
});

/**
 * Create crypto payment order
 * POST /api/v1/payments/crypto/create-order
 */
export const createCryptoOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            creatorId,
            type, // 'SUBSCRIPTION', 'TIP', 'PPV_MESSAGE', 'PPV_POST'
            amountUSD,
            subscriptionId,
            postId,
            messageId,
        } = req.body;

        // Validations
        if (!creatorId) {
            return res.status(400).json({
                success: false,
                message: 'Creator ID is required',
            });
        }

        if (!amountUSD || amountUSD < 1) {
            return res.status(400).json({
                success: false,
                message: 'Minimum amount is $1',
            });
        }

        if (amountUSD > 10000) {
            return res.status(400).json({
                success: false,
                message: 'Maximum amount is $10,000',
            });
        }

        // Get creator
        const creator = await prisma.creator.findUnique({
            where: { id: creatorId },
            select: {
                id: true,
                payoutWallet: true,
                displayName: true,
                user: {
                    select: {
                        username: true,
                    },
                },
            },
        });

        if (!creator) {
            return res.status(404).json({
                success: false,
                message: 'Creator not found',
            });
        }

        if (!creator.payoutWallet) {
            return res.status(400).json({
                success: false,
                message: 'Creator has not configured their wallet yet',
            });
        }

        // Generate unique order ID
        const orderId = `ord_${uuidv4().replace(/-/g, '')}`;

        // Calculate fees
        const platformFee = parseFloat(amountUSD) * 0.10; // 10%
        const netAmount = parseFloat(amountUSD) - platformFee;

        // Convert to USDC amount (6 decimals)
        const usdcAmount = BigInt(Math.floor(parseFloat(amountUSD) * 1e6));

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                userId,
                creatorId,
                type,
                amountUSD: parseFloat(amountUSD),
                currency: 'USDC',
                status: 'PENDING',
                gateway: 'CRYPTO_DIRECT',
                gatewayOrderId: orderId,
                platformFee,
                gatewayFee: 0, // No gateway fee for direct crypto
                netAmount,
                subscriptionId,
                postId,
                messageId,
                cryptoCurrency: 'USDC',
                cryptoAmount: usdcAmount.toString(),
                expectedAmount: usdcAmount.toString(),
                metadata: {
                    orderId,
                    creatorWallet: creator.payoutWallet,
                    contractAddress: process.env.PAYMENT_CONTRACT_ADDRESS,
                    network: network.name,
                },
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            },
        });

        logger.info('✅ Crypto order created:', {
            orderId,
            paymentId: payment.id,
            userId,
            creatorId,
            amountUSD,
        });

        // Return payment details for frontend
        res.status(201).json({
            success: true,
            data: {
                paymentId: payment.id,
                orderId,

                // Payment details
                amountUSD: parseFloat(amountUSD),
                amountUSDC: formatUnits(usdcAmount, 6),
                platformFee,
                netAmount,

                // Contract info
                contractAddress: process.env.PAYMENT_CONTRACT_ADDRESS,
                creatorWallet: creator.payoutWallet,

                // Network
                network: network.name,
                chainId: network.id,

                // USDC contract
                usdcAddress: process.env.USDC_ADDRESS_POLYGON,

                // Expiration
                expiresAt: payment.expiresAt,

                // Creator info
                creator: {
                    id: creator.id,
                    displayName: creator.displayName,
                    username: creator.user.username,
                },
            },
        });
    } catch (error) {
        logger.error('Error creating crypto order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message,
        });
    }
};

/**
 * Verify payment on-chain
 * POST /api/v1/payments/crypto/verify
 */
export const verifyPayment = async (req, res) => {
    try {
        const { paymentId, txHash } = req.body;
        const userId = req.user.id;

        if (!txHash || !txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction hash',
            });
        }

        // Get payment
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                userId,
                status: 'PENDING',
            },
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found or already processed',
            });
        }

        // Get transaction receipt
        const receipt = await publicClient.getTransactionReceipt({
            hash: txHash,
        });

        if (!receipt) {
            return res.status(400).json({
                success: false,
                message: 'Transaction not found on blockchain',
            });
        }

        // Check if transaction was successful
        if (receipt.status !== 'success') {
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'FAILED',
                    web3TxHash: txHash,
                },
            });

            return res.status(400).json({
                success: false,
                message: 'Transaction failed on blockchain',
            });
        }

        // Update payment with tx hash
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'CONFIRMING',
                web3TxHash: txHash,
                web3BlockNumber: Number(receipt.blockNumber),
                web3Confirmations: 0,
            },
        });

        logger.info('Payment verification started:', {
            paymentId,
            txHash,
        });

        res.json({
            success: true,
            message: 'Payment verification started',
            data: {
                paymentId,
                txHash,
                status: 'CONFIRMING',
                blockNumber: Number(receipt.blockNumber),
            },
        });
    } catch (error) {
        logger.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message,
        });
    }
};

/**
 * Get payment status
 * GET /api/v1/payments/crypto/:paymentId/status
 */
export const getCryptoPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                userId,
            },
            include: {
                creator: {
                    select: {
                        displayName: true,
                        payoutWallet: true,
                        user: {
                            select: {
                                username: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        // If has tx hash and still confirming, check blockchain
        if (payment.web3TxHash && payment.status === 'CONFIRMING') {
            try {
                const currentBlock = await publicClient.getBlockNumber();
                const confirmations = Number(currentBlock) - payment.web3BlockNumber;

                await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        web3Confirmations: confirmations,
                    },
                });

                payment.web3Confirmations = confirmations;
            } catch (error) {
                logger.error('Error checking confirmations:', error);
            }
        }

        res.json({
            success: true,
            data: {
                id: payment.id,
                status: payment.status,
                amountUSD: payment.amountUSD,
                type: payment.type,
                gateway: payment.gateway,
                web3TxHash: payment.web3TxHash,
                web3Confirmations: payment.web3Confirmations,
                confirmedAt: payment.confirmedAt,
                createdAt: payment.createdAt,
                expiresAt: payment.expiresAt,
                creator: payment.creator,
            },
        });
    } catch (error) {
        logger.error('Error getting payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment status',
        });
    }
};

/**
 * Get USDC price in fiat (for display)
 * GET /api/v1/payments/crypto/price
 */
export const getUSDCPrice = async (req, res) => {
    try {
        const { amount, currency = 'BRL' } = req.query;

        // For USDC, it's 1:1 with USD
        // Convert USD to requested currency
        const rates = {
            USD: 1,
            BRL: 5.5, // Example rate
            EUR: 0.92,
            GBP: 0.79,
        };

        const rate = rates[currency] || 1;
        const convertedAmount = parseFloat(amount) * rate;

        res.json({
            success: true,
            data: {
                amountUSD: parseFloat(amount),
                amountUSDC: parseFloat(amount),
                currency,
                convertedAmount: convertedAmount.toFixed(2),
                rate,
            },
        });
    } catch (error) {
        logger.error('Error getting price:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get price',
        });
    }
};

/**
 * Get creator's pending balance
 * GET /api/v1/creators/balance
 */
export const getCreatorBalance = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get creator
        const creator = await prisma.creator.findUnique({
            where: { userId },
            include: {
                balance: true,
            },
        });

        if (!creator) {
            return res.status(404).json({
                success: false,
                message: 'Creator profile not found',
            });
        }

        // Get on-chain balance if wallet configured
        let onChainBalance = 0;
        if (creator.payoutWallet && process.env.PAYMENT_CONTRACT_ADDRESS) {
            try {
                // Read from contract
                const balance = await publicClient.readContract({
                    address: process.env.PAYMENT_CONTRACT_ADDRESS,
                    abi: [{
                        name: 'creatorBalances',
                        type: 'function',
                        stateMutability: 'view',
                        inputs: [{ name: 'creator', type: 'address' }],
                        outputs: [{ name: '', type: 'uint256' }],
                    }],
                    functionName: 'creatorBalances',
                    args: [creator.payoutWallet],
                });

                onChainBalance = Number(formatUnits(balance, 6));
            } catch (error) {
                logger.error('Error reading on-chain balance:', error);
            }
        }

        res.json({
            success: true,
            data: {
                availableUSD: creator.balance?.availableUSD || 0,
                lifetimeEarnings: creator.balance?.lifetimeEarnings || 0,
                onChainBalance, // Available to withdraw from contract
                payoutWallet: creator.payoutWallet,
                hasWallet: !!creator.payoutWallet,
            },
        });
    } catch (error) {
        logger.error('Error getting creator balance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get balance',
        });
    }
};

export default {
    createCryptoOrder,
    verifyPayment,
    getCryptoPaymentStatus,
    getUSDCPrice,
    getCreatorBalance,
};