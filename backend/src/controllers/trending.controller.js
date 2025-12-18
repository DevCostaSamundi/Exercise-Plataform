import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Obter posts em trending
 * GET /api/v1/trending/posts
 */
export const getTrendingPosts = async (req, res) => {
  try {
    const { period = '24h', limit = 20 } = req.query;

    // Calcular data de início baseado no período
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h': 
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d': 
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setHours(now.getHours() - 24);
    }

    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        isPublished: true,
      },
      include: {
        creator: {
          include: {
            user:  {
              select: {
                id: true,
                username:  true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { likesCount: 'desc' },
        { viewsCount: 'desc' },
        { commentsCount: 'desc' },
      ],
      take: parseInt(limit),
    });

    res.json({
      success: true,
      posts:  posts.map(post => ({
        id: post.id,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        isPPV: post.isPPV,
        price: post.price,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        viewsCount: post.viewsCount,
        createdAt: post.createdAt,
        creator: {
          id: post.creator.id,
          username: post.creator.user.username,
          displayName: post.creator.user.displayName,
          avatar: post.creator.user.avatar,
        },
      })),
    });
  } catch (error) {
    logger.error('Error fetching trending posts:', error);
    res.status(500).json({
      success: false,
      message:  'Failed to fetch trending posts',
    });
  }
};

/**
 * Obter criadores em trending
 * GET /api/v1/trending/creators
 */
export const getTrendingCreators = async (req, res) => {
  try {
    const { period = '24h', limit = 20 } = req.query;

    // Calcular data de início
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h': 
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate. setHours(now.getHours() - 24);
    }

    // Buscar criadores com mais atividade recente
    const creators = await prisma.creator.findMany({
      where: {
        posts: {
          some: {
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            posts: true,
            subscriptions: true,
          },
        },
      },
      orderBy: {
        subscriberCount: 'desc',
      },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      creators: creators.map(creator => ({
        id: creator.id,
        username: creator.user.username,
        displayName: creator.user.displayName || creator.user.username,
        avatar: creator.user.avatar,
        bio: creator.user.bio,
        subscriptionPrice: creator.subscriptionPrice,
        subscriberCount: creator.subscriberCount || 0,
        postsCount: creator._count.posts,
        isVerified: creator.isVerified,
        coverImage: creator.coverImage,
      })),
    });
  } catch (error) {
    logger.error('Error fetching trending creators:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending creators',
    });
  }
};

/**
 * Obter tags em trending
 * GET /api/v1/trending/tags
 */
export const getTrendingTags = async (req, res) => {
  try {
    // Por enquanto, retornar array vazio
    // TODO: Implementar sistema de tags
    res.json({
      success: true,
      tags: [],
    });
  } catch (error) {
    logger.error('Error fetching trending tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending tags',
    });
  }
};

export default {
  getTrendingPosts,
  getTrendingCreators,
  getTrendingTags,
};