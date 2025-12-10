import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get trending posts
 */
export const getTrendingPosts = async (req, res) => {
  try {
    const { period = '7d', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get posts with engagement counts
    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: parseInt(limit),
    });

    // Calculate engagement score and sort
    const trending = posts.map(post => ({
      ...post,
      engagementScore: (post._count.likes * 2) + post._count.comments + (post.viewCount || 0),
    })).sort((a, b) => b.engagementScore - a.engagementScore);

    const total = await prisma.post.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    res.json({
      success: true,
      data: trending,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get trending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending posts',
    });
  }
};

/**
 * Get trending creators
 */
export const getTrendingCreators = async (req, res) => {
  try {
    const { period = '7d', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get creators with recent activity
    const creators = await prisma.creator.findMany({
      include: {
        user: {
          select: {
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
        posts: {
          where: {
            createdAt: {
              gte: startDate,
            },
          },
          select: {
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
            viewCount: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
    });

    // Calculate trending score
    const trending = creators.map(creator => {
      const totalLikes = creator.posts.reduce((sum, post) => sum + post._count.likes, 0);
      const totalComments = creator.posts.reduce((sum, post) => sum + post._count.comments, 0);
      const totalViews = creator.posts.reduce((sum, post) => sum + (post.viewCount || 0), 0);
      const recentPosts = creator.posts.length;

      const trendingScore = (totalLikes * 2) + totalComments + (totalViews * 0.1) + (recentPosts * 5) + (creator._count.subscriptions * 10);

      return {
        id: creator.id,
        username: creator.user.username,
        displayName: creator.displayName || creator.user.displayName,
        avatar: creator.user.avatar,
        bio: creator.bio,
        subscriptionPrice: creator.subscriptionPrice,
        isVerified: creator.isVerified,
        subscriberCount: creator._count.subscriptions,
        postCount: creator._count.posts,
        recentPosts,
        trendingScore,
      };
    }).sort((a, b) => b.trendingScore - a.trendingScore);

    const total = await prisma.creator.count();

    res.json({
      success: true,
      data: trending,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get trending creators error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending creators',
    });
  }
};

/**
 * Get trending tags/hashtags
 */
export const getTrendingTags = async (req, res) => {
  try {
    const { period = '7d', limit = 20 } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get posts with tags in the time period
    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        tags: {
          not: null,
        },
      },
      select: {
        tags: true,
      },
    });

    // Count tag occurrences
    const tagCounts = {};
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Convert to array and sort
    const trendingTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: trendingTags,
    });
  } catch (error) {
    logger.error('Get trending tags error:', error);
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
