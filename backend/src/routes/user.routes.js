import express from 'express';
import userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import prisma from '../config/database.js';
import validate from '../middleware/validation.middleware.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateEmailSchema,
} from '../validators/user.validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/user/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /api/v1/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

/**
 * @route   PUT /api/v1/user/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', validate(changePasswordSchema), userController.changePassword);

/**
 * @route   PUT /api/v1/user/email
 * @desc    Update email
 * @access  Private
 */
router.put('/email', validate(updateEmailSchema), userController.updateEmail);

/**
 * @route   DELETE /api/v1/user/account
 * @desc    Delete account
 * @access  Private
 */
router.delete('/account', userController.deleteAccount);

/**
 * @route   GET /api/v1/user/:id/subscription-status
 * @desc    Check if user has active subscription to a creator
 * @access  Private
 */
router.get('/:id/subscription-status', userController.getSubscriptionStatus);

/**
 * @route   GET /api/v1/user/:id/has-tipped
 * @desc    Check if user has ever tipped a creator
 * @access  Private
 */
router.get('/:id/has-tipped', userController.getHasTipped);

/**
 * @route   GET /api/v1/user/subscriptions
 * @desc    Obter assinaturas do usuário
 * @access  Private
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'ACTIVE' } = req.query;

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        ...(status !== 'ALL' && { status }),
      },
      include: {
        creator: {
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
    });
  }
});

/**
 * @route   GET /api/v1/user/favorites
 * @desc    Get user's favorite posts
 * @access  Private
 */
router.get('/favorites', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            creator: {
              include: {
                user: {
                  select: {
                    username: true,
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.favorite.count({ where: { userId } });

    res.json({
      success: true,
      data: favorites.map(f => f.post),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
    });
  }
});

/**
 * @route   GET /api/v1/user/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, unread } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId };
    if (unread === 'true') {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
});

/**
 * @route   PUT /api/v1/user/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    if (notification.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
});

/**
 * @route   PUT /api/v1/user/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/notifications/read-all', async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
    });
  }
});

/**
 * @route   GET /api/v1/user/wallet
 * @desc    Get user wallet balance
 * @access  Private
 */
router.get('/wallet', async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // Create wallet if doesn't exist
      const newWallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });

      return res.json({
        success: true,
        data: newWallet,
      });
    }

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet',
    });
  }
});

/**
 * @route   GET /api/v1/user/transactions
 * @desc    Get user transaction history
 * @access  Private
 */
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId };
    if (type) {
      where.type = type;
    }

    const transactions = await prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.walletTransaction.count({ where });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
    });
  }
});

export default router;
