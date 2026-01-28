import prisma from '../config/database.js';
import web3AuthService from '../services/web3auth.service.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Login/Register with Web3Auth
 * POST /api/v1/auth/web3auth/login
 */
export const web3AuthLogin = async (req, res) => {
    try {
        const { idToken, walletAddress, publicKey } = req.body;

        // Validate required fields
        if (!idToken || !walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'ID token and wallet address required',
            });
        }

        // Verify Web3Auth token
        const verification = await web3AuthService.verifyToken(idToken);

        if (!verification.valid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Web3Auth token',
            });
        }

        // Validate wallet address
        if (!web3AuthService.isValidAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet address',
            });
        }

        const { email, name, profileImage, typeOfLogin } = verification;

        // Check if user exists by email or wallet
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { web3Wallet: walletAddress.toLowerCase() },
                ],
            },
        });

        if (user) {
            // User exists - update wallet if needed
            if (!user.web3Wallet || user.web3Wallet !== walletAddress.toLowerCase()) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        web3Wallet: walletAddress.toLowerCase(),
                        web3Provider: web3AuthService.mapProvider(typeOfLogin),
                        web3Verified: true,
                        web3VerifiedAt: new Date(),
                    },
                });
            }

            logger.info('User logged in with Web3Auth:', {
                userId: user.id,
                email,
                wallet: walletAddress,
            });
        } else {
            // Create new user
            const username = email.split('@')[0] + '_' + crypto.randomBytes(3).toString('hex');

            user = await prisma.user.create({
                data: {
                    email,
                    username,
                    displayName: name || username,
                    avatar: profileImage,
                    web3Wallet: walletAddress.toLowerCase(),
                    web3Provider: web3AuthService.mapProvider(typeOfLogin),
                    web3Verified: true,
                    web3VerifiedAt: new Date(),
                    isVerified: true, // Auto-verify email since Web3Auth verified it
                    password: '', // No password for Web3Auth users
                },
            });

            // Create user wallet
            await prisma.userWallet.create({
                data: {
                    userId: user.id,
                },
            });

            logger.info('New user created with Web3Auth:', {
                userId: user.id,
                email,
                wallet: walletAddress,
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                wallet: user.web3Wallet,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.displayName,
                    avatar: user.avatar,
                    web3Wallet: user.web3Wallet,
                    web3Provider: user.web3Provider,
                },
                token,
            },
        });
    } catch (error) {
        logger.error('Web3Auth login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
        });
    }
};

/**
 * Link additional wallet to existing account
 * POST /api/v1/auth/web3auth/link-wallet
 */
export const linkWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { walletAddress, signature, message } = req.body;

        // Validate address
        if (!web3AuthService.isValidAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet address',
            });
        }

        // Verify signature
        const isValid = await web3AuthService.verifyWalletOwnership(
            message,
            signature,
            walletAddress
        );

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid signature',
            });
        }

        // Check if wallet already in use
        const existingUser = await prisma.user.findFirst({
            where: {
                web3Wallet: walletAddress.toLowerCase(),
                NOT: { id: userId },
            },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Wallet already linked to another account',
            });
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                web3Wallet: walletAddress.toLowerCase(),
                web3Verified: true,
                web3VerifiedAt: new Date(),
            },
        });

        logger.info('Wallet linked:', {
            userId,
            wallet: walletAddress,
        });

        res.json({
            success: true,
            message: 'Wallet linked successfully',
            data: {
                web3Wallet: user.web3Wallet,
            },
        });
    } catch (error) {
        logger.error('Link wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to link wallet',
        });
    }
};

/**
 * Get user's wallet info
 * GET /api/v1/auth/web3auth/wallet
 */
export const getWalletInfo = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                web3Wallet: true,
                web3Provider: true,
                web3Verified: true,
                wallet: {
                    select: {
                        balanceUSD: true,
                        totalDeposited: true,
                        totalSpent: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            data: {
                hasWallet: !!user.web3Wallet,
                address: user.web3Wallet,
                provider: user.web3Provider,
                verified: user.web3Verified,
                balance: user.wallet?.balanceUSD || 0,
                totalDeposited: user.wallet?.totalDeposited || 0,
                totalSpent: user.wallet?.totalSpent || 0,
            },
        });
    } catch (error) {
        logger.error('Get wallet info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wallet info',
        });
    }
};

export default {
    web3AuthLogin,
    linkWallet,
    getWalletInfo,
};