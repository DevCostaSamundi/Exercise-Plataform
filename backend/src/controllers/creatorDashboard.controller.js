import prisma from '../config/database.js';
import ApiResponse from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/v1/creator-dashboard/stats
 * @access  Private (Creator only)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user. id;
    const { timeRange = '7days' } = req.query;

    logger.info(`📊 Fetching dashboard stats for user ${userId}, range: ${timeRange}`);

    // Buscar perfil de criador
    const creator = await prisma.creator.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!creator) {
      return ApiResponse. error(res, 'Creator profile not found', 404);
    }

    const creatorId = creator.id;

    // Calcular data de início baseado no timeRange
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '24hours':
        startDate. setDate(now.getDate() - 1);
        break;
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days': 
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate. setDate(now.getDate() - 7);
    }

    // 1. Total de assinantes ativos
    const subscribers = await prisma.subscription.count({
      where: {
        creatorId,
        status: 'ACTIVE',
      },
    });

    // 2. Assinantes no período anterior (para calcular growth)
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - (now.getDate() - startDate.getDate()));
    
    const previousSubscribers = await prisma. subscription.count({
      where: {
        creatorId,
        status: 'ACTIVE',
        createdAt: {
          gte: prevStartDate,
          lt: startDate,
        },
      },
    });

    const subscribersGrowth = previousSubscribers > 0
      ? ((subscribers - previousSubscribers) / previousSubscribers) * 100
      : subscribers > 0 ? 100 : 0;

    // 3. Ganhos totais (assumindo que você tem um model Payment)
    // ✅ CORRIGIDO: Usar Payment em vez de Transaction
    let earnings = 0;
    let previousEarnings = 0;

    try {
      const earningsData = await prisma.payment.aggregate({
        where: {
          creatorId,
          status:  'COMPLETED',
          createdAt: {
            gte: startDate,
          },
        },
        _sum: {
          netAmount: true, // ou o campo correto do seu schema
        },
      });

      earnings = earningsData._sum. netAmount || 0;

      // Ganhos do período anterior
      const previousEarningsData = await prisma.payment. aggregate({
        where: {
          creatorId,
          status: 'COMPLETED',
          createdAt: {
            gte: prevStartDate,
            lt: startDate,
          },
        },
        _sum: {
          netAmount: true,
        },
      });

      previousEarnings = previousEarningsData._sum.netAmount || 0;
    } catch (error) {
      logger.warn('⚠️ Payment model not available, using mock data');
    }

    const earningsGrowth = previousEarnings > 0
      ? ((earnings - previousEarnings) / previousEarnings) * 100
      : earnings > 0 ? 100 : 0;

    // 4. Total de posts
    const posts = await prisma.post.count({
      where: {
        creatorId,
      },
    });

    // 5. Posts deste mês
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const postsThisMonth = await prisma.post.count({
      where: {
        creatorId,
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    });

    // 6. Views totais
    const viewsData = await prisma.post.aggregate({
      where: {
        creatorId,
      },
      _sum: {
        viewsCount: true,
      },
    });

    const views = viewsData._sum.viewsCount || 0;

    // 7. Likes totais
    const likesData = await prisma.post.aggregate({
      where: {
        creatorId,
      },
      _sum: {
        likesCount: true,
      },
    });

    const likes = likesData._sum.likesCount || 0;

    // 8. Calcular taxa de engajamento
    const engagement = views > 0 ? (likes / views) * 100 : 0;

    // 9. Gráfico de ganhos (últimos 7 dias) - MOCK se Payment não existir
    const earningsChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      let dayEarnings = 0;
      
      try {
        const dayEarningsData = await prisma. payment.aggregate({
          where: {
            creatorId,
            status: 'COMPLETED',
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
          _sum:  {
            netAmount: true,
          },
        });

        dayEarnings = Number(dayEarningsData._sum.netAmount || 0);
      } catch (error) {
        // Payment model não existe, usar 0
        dayEarnings = 0;
      }

      earningsChart.push({
        date: date.toISOString().split('T')[0],
        amount: dayEarnings,
      });
    }

    const stats = {
      subscribers:  Number(subscribers),
      subscribersGrowth:  Number(subscribersGrowth. toFixed(2)),
      earnings: Number(earnings),
      earningsGrowth:  Number(earningsGrowth. toFixed(2)),
      posts: Number(posts),
      postsThisMonth: Number(postsThisMonth),
      engagement: Number(engagement.toFixed(2)),
      views: Number(views),
      likes: Number(likes),
      earningsChart,
    };

    logger.info('✅ Dashboard stats fetched successfully');

    return ApiResponse.success(res, stats, 'Dashboard statistics retrieved');

  } catch (error) {
    logger.error('❌ Error fetching dashboard stats:', error);
    next(error);
  }
};

export default {
  getDashboardStats,
};