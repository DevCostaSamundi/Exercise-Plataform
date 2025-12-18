import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import ApiResponse from '../utils/response.js';

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
 * ADICIONAR ESTA FUNÇÃO NOVA
 * Criar nova assinatura
 * POST /api/v1/subscriptions/: creatorId
 */
export const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { creatorId } = req.params;
    const { planType = 'monthly' } = req.body; // monthly, quarterly, annual

    // Verificar se o criador existe
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
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

    // Verificar se não é o próprio criador tentando se inscrever
    if (creator.userId === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot subscribe to yourself',
      });
    }

    // Verificar se já existe assinatura ativa
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        creatorId,
        status: {
          in: ['ACTIVE', 'TRIALING'],
        },
      },
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription to this creator',
      });
    }

    // Calcular preço baseado no plano
    const basePrice = creator.subscriptionPrice || 9.99;
    let price = basePrice;
    let duration = 1; // meses

    switch (planType) {
      case 'quarterly':
        duration = 3;
        price = basePrice * 3 * 0.9; // 10% desconto
        break;
      case 'annual':
        duration = 12;
        price = basePrice * 12 * 0.8; // 20% desconto
        break;
      default:
        duration = 1;
        price = basePrice;
    }

    // Calcular data de expiração
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + duration);

    // Criar assinatura
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        creatorId,
        status: 'ACTIVE', // Em produção, seria 'PENDING' até confirmar pagamento
        price,
        planType,
        startedAt: now,
        expiresAt,
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

    // Incrementar contador de assinantes do criador
    await prisma.creator.update({
      where: { id: creatorId },
      data: {
        subscriberCount: {
          increment: 1,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        id: subscription.id,
        creatorId: subscription.creatorId,
        creatorName: subscription.creator.user.displayName || subscription.creator.user.username,
        status: subscription.status,
        price: subscription.price,
        planType: subscription.planType,
        expiresAt: subscription.expiresAt,
        autoRenew: subscription.autoRenew,
      },
    });
  } catch (error) {
    logger.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
    });
  }
};

// Exportar também a nova função
export default {
  checkSubscription,
  getUserSubscriptions,
  cancelSubscription,
  createSubscription, // ADICIONAR AQUI
};