import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export const getTrendingPosts = async (req, res) => {
  try {
    const { period = '24h', limit = 20 } = req.query;

    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      default: startDate.setHours(now.getHours() - 24);
    }

    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'PUBLISHED',  // ✅ corrigido de isPublished
        isPublic: true,       // ✅ adicionado
      },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
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
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        mediaUrls: post.mediaUrls,
        mediaType: post.mediaType,
        isPPV: post.isPPV,
        ppvPrice: post.ppvPrice,
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
    res.status(500).json({ success: false, message: 'Failed to fetch trending posts' });
  }
};

export const getTrendingCreators = async (req, res) => {
  try {
    const { period = '24h', limit = 10 } = req.query;

    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      default: startDate.setHours(now.getHours() - 24);
    }

    const creators = await prisma.creator.findMany({
      where: {
        posts: {
          some: {
            createdAt: { gte: startDate },
            status: 'PUBLISHED',  // ✅ corrigido
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
        postsCount: 'desc',  // ✅ usar postsCount em vez de subscriberCount
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
        subscriptionPrice: creator.subscriptionPrice,
        subscriberCount: creator._count.subscriptions || 0,  // ✅ via _count
        postsCount: creator._count.posts,
        isVerified: creator.isVerified,
        coverImage: creator.coverImage,
      })),
    });
  } catch (error) {
    console.error('TRENDING ERROR FULL', error);
    logger.error('Error fetching trending creators:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending creators' });
  }
};

export const getTrendingTags = async (req, res) => {
  try {
    res.json({ success: true, tags: [] });
  } catch (error) {
    logger.error('Error fetching trending tags:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending tags' });
  }
};

export default { getTrendingPosts, getTrendingCreators, getTrendingTags };