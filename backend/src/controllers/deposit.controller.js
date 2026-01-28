import depositDetectorService from '../services/deposit-detector.service.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get user's deposit address
 * GET /api/v1/wallet/deposit/address
 */
export const getDepositAddress = async (req, res) => {
    try {
        const userId = req.user.id;

        const depositInfo = await depositDetectorService.getDepositAddress(userId);
        const instructions = depositDetectorService.getDepositInstructions(depositInfo.address);

        res.json({
            success: true,
            data: {
                ...depositInfo,
                instructions,
            },
        });
    } catch (error) {
        logger.error('Get deposit address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get deposit address',
        });
    }
};

/**
 * Get deposit history
 * GET /api/v1/wallet/deposit/history
 */
export const getDepositHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20 } = req.query;

        const deposits = await depositDetectorService.getDepositHistory(
            userId,
            parseInt(limit)
        );

        res.json({
            success: true,
            data: deposits,
        });
    } catch (error) {
        logger.error('Get deposit history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get deposit history',
        });
    }
};

/**
 * Get wallet balance
 * GET /api/v1/wallet/balance
 */
export const getWalletBalance = async (req, res) => {
    try {
        const userId = req.user.id;

        const wallet = await prisma.userWallet.findUnique({
            where: { userId },
        });

        if (!wallet) {
            // Create wallet if doesn't exist
            const newWallet = await prisma.userWallet.create({
                data: { userId },
            });

            return res.json({
                success: true,
                data: {
                    balance: 0,
                    totalDeposited: 0,
                    totalSpent: 0,
                },
            });
        }

        res.json({
            success: true,
            data: {
                balance: wallet.balanceUSD,
                totalDeposited: wallet.totalDeposited,
                totalSpent: wallet.totalSpent,
            },
        });
    } catch (error) {
        logger.error('Get wallet balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get balance',
        });
    }
};

/**
 * Check if has sufficient balance
 * POST /api/v1/wallet/check-balance
 */
export const checkBalance = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount',
            });
        }

        const validation = await depositDetectorService.validateBalance(
            userId,
            parseFloat(amount)
        );

        res.json({
            success: true,
            data: validation,
        });
    } catch (error) {
        logger.error('Check balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check balance',
        });
    }
};

export default {
    getDepositAddress,
    getDepositHistory,
    getWalletBalance,
    checkBalance,
};