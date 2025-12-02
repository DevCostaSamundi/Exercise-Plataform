import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import paymentService from '../services/payment/index.js';

/**
 * Solicitar saque
 */
export const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amountUSD, cryptoCurrency, destinationAddress } = req.body;

    // Validações
    if (!amountUSD || amountUSD < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is $10',
      });
    }

    if (!cryptoCurrency || !destinationAddress) {
      return res.status(400).json({
        success: false,
        message: 'Cryptocurrency and destination address are required',
      });
    }

    // Buscar criador
    const creator = await prisma.creator.findUnique({
      where: { userId },
      include: { balance: true },
    });

    if (!creator) {
      return res.status(403).json({
        success: false,
        message: 'Only creators can request withdrawals',
      });
    }

    // Verificar saldo
    const availableBalance = creator.balance?.availableUSD || 0;
    
    if (availableBalance < amountUSD) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance.  Available: $${availableBalance}`,
      });
    }

    // Calcular taxas
    const platformFee = 2; // Taxa fixa $2
    const netAmount = amountUSD - platformFee;

    if (netAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount too low after fees',
      });
    }

    // Estimar quantidade em cripto
    let cryptoAmount;
    try {
      const estimate = await paymentService.nowpayments.estimatePrice(
        netAmount,
        cryptoCurrency. toLowerCase().replace('_', '')
      );
      cryptoAmount = estimate.estimated_amount;
    } catch (error) {
      logger.error('Estimate withdrawal amount error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to estimate crypto amount',
      });
    }

    // Criar withdrawal
    const withdrawal = await prisma.withdrawal.create({
      data: {
        creatorId: creator.id,
        amountUSD,
        cryptoCurrency,
        cryptoAmount: cryptoAmount.toString(),
        destinationAddress,
        status: 'PENDING',
        platformFee,
        netAmount,
        gateway: 'NOWPAYMENTS',
      },
    });

    // Deduzir do saldo disponível
    await prisma.creatorBalance.update({
      where: { creatorId: creator.id },
      data: {
        availableUSD: { decrement: amountUSD },
        pendingUSD: { increment: amountUSD },
      },
    });

    logger.info(`Withdrawal requested: ${withdrawal.id} - $${amountUSD}`);

    res.status(201).json({
      success: true,
      data: {
        id: withdrawal.id,
        amountUSD,
        cryptoCurrency,
        cryptoAmount,
        destinationAddress,
        platformFee,
        netAmount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error) {
    logger.error('Request withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request withdrawal',
    });
  }
};

/**
 * Processar saque (ADMIN ou CRON)
 */
export const processWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { creator: true },
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
      });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Withdrawal already ${withdrawal.status.toLowerCase()}`,
      });
    }

    // Atualizar para PROCESSING
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'PROCESSING' },
    });

    // TODO: Implementar envio real via NOWPayments Payout API
    // Por enquanto, simular envio bem-sucedido
    
    const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;

    // Atualizar para COMPLETED
    const completed = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'COMPLETED',
        txHash,
        processedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Atualizar saldo do criador
    await prisma.creatorBalance.update({
      where: { creatorId: withdrawal.creatorId },
      data: {
        pendingUSD: { decrement: withdrawal.amountUSD },
        totalWithdrawn: { increment: withdrawal.amountUSD },
        lastWithdrawalAt: new Date(),
      },
    });

    logger.info(`Withdrawal completed: ${withdrawalId}`);

    res.json({
      success: true,
      data: completed,
    });
  } catch (error) {
    logger. error('Process withdrawal error:', error);
    
    // Reverter para PENDING em caso de erro
    await prisma.withdrawal.update({
      where: { id: req.params.withdrawalId },
      data: { status: 'PENDING' },
    });

    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
    });
  }
};

/**
 * Listar saques do criador
 */
export const getCreatorWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator) {
      return res.status(403).json({
        success: false,
        message: 'Only creators can view withdrawals',
      });
    }

    const where = { creatorId: creator.id };
    if (status) where.status = status;

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.withdrawal.count({ where });

    res.json({
      success: true,
      data: withdrawals,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawals',
    });
  }
};

/**
 * Obter saldo do criador
 */
export const getCreatorBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const creator = await prisma.creator.findUnique({
      where: { userId },
      include: {
        balance: true,
      },
    });

    if (!creator) {
      return res.status(403).json({
        success: false,
        message: 'Only creators have balance',
      });
    }

    // Se não tem balance, criar
    let balance = creator.balance;
    if (!balance) {
      balance = await prisma.creatorBalance.create({
        data: {
          creatorId: creator.id,
          availableUSD: 0,
          pendingUSD: 0,
          lifetimeEarnings: 0,
          totalWithdrawn: 0,
        },
      });
    }

    // Buscar estatísticas do mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await prisma.payment.aggregate({
      where: {
        creatorId: creator.id,
        status: 'COMPLETED',
        confirmedAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        netAmount: true,
      },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        availableUSD: balance.availableUSD,
        pendingUSD: balance.pendingUSD,
        lifetimeEarnings: balance.lifetimeEarnings,
        totalWithdrawn: balance.totalWithdrawn,
        monthlyEarnings: monthlyStats._sum.netAmount || 0,
        monthlyTransactions: monthlyStats._count || 0,
        lastPaymentAt: balance.lastPaymentAt,
        lastWithdrawalAt: balance.lastWithdrawalAt,
      },
    });
  } catch (error) {
    logger.error('Get creator balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance',
    });
  }
};

/**
 * Cancelar saque pendente
 */
export const cancelWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { withdrawalId } = req.params;

    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal || withdrawal.creatorId !== creator.id) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
      });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending withdrawals',
      });
    }

    // Cancelar e retornar saldo
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'CANCELLED' },
    });

    await prisma.creatorBalance.update({
      where: { creatorId: creator.id },
      data: {
        availableUSD: { increment: withdrawal.amountUSD },
        pendingUSD: { decrement: withdrawal.amountUSD },
      },
    });

    res.json({
      success: true,
      message: 'Withdrawal cancelled',
    });
  } catch (error) {
    logger.error('Cancel withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel withdrawal',
    });
  }
};

export default {
  requestWithdrawal,
  processWithdrawal,
  getCreatorWithdrawals,
  getCreatorBalance,
  cancelWithdrawal,
};