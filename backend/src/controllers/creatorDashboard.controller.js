import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '7days' } = req.query;

    // Calcular data de início baseado no timeRange
    const startDate = new Date();
    if (timeRange === '7days') startDate.setDate(startDate.getDate() - 7);
    else if (timeRange === '30days') startDate.setDate(startDate.getDate() - 30);
    else if (timeRange === '90days') startDate.setDate(startDate.getDate() - 90);

    // Buscar creator
    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Stats básicos (mock - implementar com dados reais)
    const stats = {
      revenue: {
        total: 0,
        subscriptions: 0,
        tips: 0,
        ppv: 0,
      },
      subscribers: {
        total: creator.subscribers || 0,
        new: 0,
        renewal: 0,
      },
      engagement: {
        likes: 0,
        comments: 0,
        views: 0,
      },
      posts: {
        total: creator.totalPosts || 0,
        published: 0,
        scheduled: 0,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
    });
  }
};
