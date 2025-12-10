import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get wallet information
 */
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    // Create wallet if doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    logger.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet',
    });
  }
};

/**
 * Get transaction history
 */
export const getTransactions = async (req, res) => {
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
    logger.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
    });
  }
};

/**
 * Export transactions to CSV
 */
export const exportTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, startDate, endDate } = req.query;

    const where = { userId };
    if (type) {
      where.type = type;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const transactions = await prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Helper to escape CSV values
    const escapeCSV = (value) => {
      if (value == null) return '';
      const str = String(value);
      // Escape quotes and wrap in quotes if contains special chars
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Generate CSV with proper escaping
    const csvHeader = 'Date,Type,Amount,Balance,Description\n';
    const csvRows = transactions.map(t => 
      `${escapeCSV(t.createdAt.toISOString())},${escapeCSV(t.type)},${escapeCSV(t.amount)},${escapeCSV(t.balance)},${escapeCSV(t.description || '')}`
    ).join('\n');
    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  } catch (error) {
    logger.error('Export transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export transactions',
    });
  }
};

export default {
  getWallet,
  getTransactions,
  exportTransactions,
};
