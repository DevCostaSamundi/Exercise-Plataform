import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Verificar status de assinatura
 */
export const checkSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { creatorId } = req.params;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        creatorId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        autoRenew: true,
        amount: true,
      },
    });

    res.json({
      success: true,
      data: {
        isSubscribed: !!subscription,
        subscription: subscription || null,
      },
    });
  } catch (error) {
    logger.error('Check subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription',
    });
  }
};

/**
 * Listar assinaturas do usuário
 */
export const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'ACTIVE' } = req.query;

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status,
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
      orderBy: { startDate: 'desc' },
    });

    const formatted = subscriptions.map(sub => ({
      id: sub.id,
      creator: {
        id: sub.creator.id,
        username: sub.creator.user.username,
        displayName: sub.creator.displayName || sub.creator.user.displayName,
        avatar: sub.creator.user.avatar,
      },
      status: sub.status,
      amount: sub.amount,
      startDate: sub.startDate,
      endDate: sub.endDate,
      autoRenew: sub.autoRenew,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    logger.error('Get user subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriptions',
    });
  }
};

/**
 * Cancelar assinatura
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscriptionId } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
    });
  }
};

/**
 * Create a new subscription
 */
export const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { creatorId } = req.params;

    // Check if creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Check if already subscribed
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        creatorId,
        status: 'ACTIVE',
      },
    });

    if (existingSubscription) {
      return res.status(409).json({
        success: false,
        message: 'Already subscribed to this creator',
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        creatorId,
        amount: creator.subscriptionPrice,
        status: 'ACTIVE',
        startDate,
        endDate,
        autoRenew: true,
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
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription created successfully',
    });
  } catch (error) {
    logger.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
    });
  }
};

export default {
  checkSubscription,
  getUserSubscriptions,
  cancelSubscription,
  createSubscription,
};