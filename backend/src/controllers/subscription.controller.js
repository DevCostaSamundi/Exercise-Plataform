import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import notificationService from '../services/notification.service.js';

/**
 * GET /api/v1/subscriptions
 * Listar assinaturas do utilizador logado
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

    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      status: sub.status,
      amount: parseFloat(sub.amount),
      startDate: sub.startDate,
      endDate: sub.endDate,
      autoRenew: sub.autoRenew,
      createdAt: sub.createdAt,
      creator: {
        id: sub.creator.id,
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
 * Iniciar processo de assinatura — cria registo PENDING aguardando pagamento
 * O frontend deve chamar /subscriptions/:id/confirm após pagamento on-chain
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

    // Verificar se já existe assinatura activa
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

    // Cancelar qualquer PENDING anterior para este criador (evitar duplicados)
    await prisma.subscription.updateMany({
      where: {
        userId,
        creatorId,
        status: 'PENDING',
      },
      data: { status: 'CANCELLED' },
    });

    // Criar assinatura como PENDING — só activa após pagamento confirmado
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        creatorId,
        status: 'PENDING',
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
                avatar: true,
                web3Wallet: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Subscription initiated. Complete payment to activate.',
      data: {
        id: subscription.id,
        status: subscription.status,
        amount: parseFloat(subscription.amount),
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        // Dados necessários para o frontend construir a transacção
        payment: {
          toAddress: subscription.creator.user.web3Wallet,
          amountUSDC: parseFloat(subscription.amount),
          currency: 'USDC',
          network: 'polygon',
        },
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
 * POST /api/v1/subscriptions/:id/confirm
 * Confirmar pagamento on-chain e activar assinatura
 * Body: { txHash, fromAddress }
 */
export const confirmSubscriptionPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { txHash, fromAddress } = req.body;

    if (!txHash || !fromAddress) {
      return res.status(400).json({
        success: false,
        message: 'txHash e fromAddress são obrigatórios',
      });
    }

    // Buscar assinatura pendente
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId, status: 'PENDING' },
      include: {
        creator: {
          include: {
            user: { select: { web3Wallet: true } },
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Pending subscription not found',
      });
    }

    // Verificar se txHash já foi usado
    const existingPayment = await prisma.payment.findFirst({
      where: { txHash },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Transaction already used',
      });
    }

    // Verificar pagamento on-chain
    const { verifyOnChainPayment } = await import('./paidMessage.controller.js');
    const creatorWallet = subscription.creator.user.web3Wallet;

    if (!creatorWallet) {
      return res.status(400).json({
        success: false,
        message: 'Creator wallet not configured',
      });
    }

    const verification = await verifyOnChainPayment(
      txHash,
      fromAddress,
      creatorWallet,
      parseFloat(subscription.amount)
    );

    if (!verification.valid) {
      return res.status(402).json({
        success: false,
        message: `Payment verification failed: ${verification.reason}`,
      });
    }

    // Activar assinatura e registar pagamento atomicamente
    const [activatedSubscription] = await prisma.$transaction([
      prisma.subscription.update({
        where: { id },
        data: { status: 'ACTIVE' },
      }),
      prisma.payment.create({
        data: {
          userId,
          creatorId: subscription.creatorId,
          type: 'SUBSCRIPTION',
          status: 'COMPLETED',
          amountUSD: parseFloat(subscription.amount),
          txHash,
          gateway: 'WEB3_DIRECT',
          completedAt: new Date(),
        },
      }),
    ]);

    // Notificar criador
    await notificationService.notifyNewSubscriber(activatedSubscription);

    logger.info('Subscription activated:', { subscriptionId: id, userId, txHash });

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        id: activatedSubscription.id,
        status: activatedSubscription.status,
        endDate: activatedSubscription.endDate,
      },
    });
  } catch (error) {
    logger.error('Confirm subscription payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm subscription payment',
    });
  }
};

/**
 * POST /api/v1/subscriptions/:id/cancel
 * Cancelar assinatura
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const subscription = await prisma.subscription.findFirst({
      where: { id, userId },
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

    await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
      },
    });

    res.json({
      success: true,
      message: 'Subscription cancelled. Access remains until end of billing period.',
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
 * GET /api/v1/subscriptions/check/:creatorId
 * Verificar se utilizador está inscrito num criador
 */
export const checkSubscription = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { creatorId } = req.params;

    if (!userId) {
      return res.json({ success: true, isSubscribed: false });
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

export default {
  getMySubscriptions,
  createSubscription,
  confirmSubscriptionPayment,
  cancelSubscription,
  checkSubscription,
};