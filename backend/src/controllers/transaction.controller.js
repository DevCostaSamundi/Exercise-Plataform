import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Obter dados da carteira
 * GET /api/v1/wallet
 */
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    // Calcular data de início
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Buscar transações do período
    const transactions = await prisma.payment.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
        status: 'COMPLETED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular estatísticas
    const totalSpent = transactions.reduce((sum, t) => sum + (t.amountUSD || 0), 0);

    // Agrupar por tipo
    const breakdown = {};
    transactions.forEach(t => {
      const type = t.type || 'OTHER';
      breakdown[type] = (breakdown[type] || 0) + (t.amountUSD || 0);
    });

    // Transações recentes (últimas 10)
    const recentTransactions = transactions.slice(0, 10).map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amountUSD,
      currency: t.cryptoCurrency,
      status: t.status,
      createdAt: t.createdAt,
      description: getTransactionDescription(t.type),
    }));

    res.json({
      success: true,
      stats: {
        totalSpent,
        transactionCount: transactions.length,
      },
      breakdown,
      recentTransactions,
    });
  } catch (error) {
    logger.error('Error fetching wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet data',
    });
  }
};

/**
 * Listar transações
 * GET /api/v1/transactions
 */
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      type,
      status,
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtros
    const where = { userId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Buscar transações
    const [transactions, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit),
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
      }),
      prisma.payment.count({ where }),
    ]);

    const formatted = transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amountUSD,
      currency: t.cryptoCurrency,
      status: t.status,
      createdAt: t.createdAt,
      creator: t.creator ? {
        id: t.creator.id,
        username: t.creator.user.username,
        displayName: t.creator.user.displayName,
        avatar: t.creator.user.avatar,
      } : null,
      description: getTransactionDescription(t.type),
    }));

    res.json({
      success: true,
      transactions: formatted,
      hasMore: skip + transactions.length < total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
    });
  }
};

/**
 * Exportar transações para CSV
 * GET /api/v1/transactions/export
 */
export const exportTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status, startDate, endDate } = req.query;

    // Construir filtros
    const where = { userId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Buscar todas as transações
    const transactions = await prisma.payment.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        creator: {
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Gerar CSV
    let csv = 'Data,Tipo,Criador,Valor (USD),Moeda,Status,ID\n';

    transactions.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0];
      const creatorName = t.creator ? t.creator.user.displayName || t.creator.user.username : 'N/A';

      csv += `${date},${t.type},${creatorName},${t.amountUSD},${t.cryptoCurrency},${t.status},${t.id}\n`;
    });

    // Enviar CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transacoes_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export transactions',
    });
  }
};

// Helper function
function getTransactionDescription(type) {
  const descriptions = {
    SUBSCRIPTION: 'Assinatura mensal',
    PPV_POST: 'Conteúdo PPV',
    PPV_MESSAGE: 'Mensagem PPV',
    TIP: 'Gorjeta',
    WALLET_DEPOSIT: 'Recarga de carteira',
  };
  return descriptions[type] || 'Transação';
}

export default {
  getWallet,
  getTransactions,
  exportTransactions,
};