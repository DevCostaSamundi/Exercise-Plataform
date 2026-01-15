// backend/src/controllers/subscription.controller.js
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import notificationService from '../services/notification.service.js';

/**
 * GET /api/v1/subscriptions
 * Listar assinaturas do usuário logado
 */
export const getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' },
    });

    // Formatar resposta
    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      status: sub.status,
      amount: parseFloat(sub.amount),
      startDate: sub.startDate,
      endDate: sub.endDate,
      autoRenew: sub.autoRenew,
      createdAt: sub.createdAt,
      creator: {
        id:  sub.creator.id,
        userId: sub.creator.userId,
        username: sub.creator.user.username,
        displayName: sub.creator.displayName || sub.creator.user.displayName,
        avatar: sub.creator.user.avatar,
      },
    }));

    res.json({
      success: true,
      data: formattedSubscriptions,
    });
  } catch (error) {
    logger.error('Get my subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriptions',
    });
  }
};

/**
 * POST /api/v1/subscriptions
 * Criar nova assinatura (requer pagamento)
 */
export const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { creatorId } = req.body;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: 'Creator ID is required',
      });
    }

    // Verificar se criador existe
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Verificar se já existe assinatura ativa
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        creatorId,
        status: 'ACTIVE',
      },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription to this creator',
      });
    }

    // Calcular datas
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Criar assinatura (pendente de pagamento)
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        creatorId,
        status: 'ACTIVE', // Será ACTIVE após pagamento confirmado
        amount: creator.subscriptionPrice,
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
                avatar:  true,
              },
            },
          },
        },
      },
    });

    // Notificar criador
    await notificationService.notifyNewSubscriber(subscription);

    res.json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        id: subscription.id,
        status: subscription.status,
        amount: parseFloat(subscription.amount),
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        needsPayment: true, // Frontend deve redirecionar para pagamento
      },
    });
  } catch (error) {
    logger.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
    });
  }
};

/**
 * POST /api/v1/subscriptions/: id/cancel
 * Cancelar assinatura
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const subscription = await prisma.subscription.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not active',
      });
    }

    // Cancelar (mantém acesso até endDate)
    await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
      },
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully.  Access will remain until the end of the billing period.',
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
 * GET /api/v1/subscriptions/check/: creatorId
 * Verificar se usuário está inscrito em um criador
 */
export const checkSubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { creatorId } = req.params;

    if (!userId) {
      return res.json({
        success: true,
        isSubscribed: false,
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        creatorId,
        status: 'ACTIVE',
      },
    });

    res.json({
      success: true,
      isSubscribed: !!subscription,
      subscription: subscription
        ? {
            id: subscription.id,
            endDate: subscription.endDate,
            autoRenew: subscription.autoRenew,
          }
        : null,
    });
  } catch (error) {
    logger.error('Check subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription',
    });
  }
};