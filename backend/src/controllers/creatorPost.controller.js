import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Obter meus posts (criador autenticado)
 */
export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 50,
      status, // all, published, scheduled, draft
      type,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Buscar criador
    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    // Construir filtros
    const where = {
      creatorId: creator.id,
    };

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (type) {
      where.type = type.toUpperCase();
    }

    // Buscar posts
    const [posts, total, stats] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          thumbnail: true,
          status: true,
          visibility: true,
          price: true,
          mediaCount: true,
          likes: true,
          comments: true,
          views: true,
          earnings: true,
          publishedAt: true,
          scheduledFor: true,
          tags: true,
          createdAt: true,
        },
      }),
      prisma.post.count({ where }),
      prisma.post.groupBy({
        by: ['status'],
        where: { creatorId: creator.id },
        _count: true,
      }),
    ]);

    // Calcular stats
    const statsObj = {
      all: total,
      published: 0,
      scheduled: 0,
      draft: 0,
    };

    stats.forEach((stat) => {
      statsObj[stat.status.toLowerCase()] = stat._count;
    });

    // Formatar posts
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      type: post.type.toLowerCase(),
      title: post.title,
      description: post.description,
      thumbnail: post.thumbnail,
      status: post.status.toLowerCase(),
      visibility: post.visibility.toLowerCase(),
      price: post.price,
      mediaCount: post.mediaCount,
      likes: post.likes,
      comments: post.comments,
      views: post.views,
      earnings: post.earnings || 0,
      publishedAt: post.publishedAt,
      scheduledFor: post.scheduledFor,
      tags: post.tags || [],
      createdAt: post.createdAt,
    }));

    res.json({
      success: true,
      data: formattedPosts,
      stats: statsObj,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get my posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts',
    });
  }
};
