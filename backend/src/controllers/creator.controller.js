import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Obter perfil público do criador
 */
export const getCreatorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            avatar: true,
            bio: true,
            genderIdentity: true,
            orientation: true,
            isVerified: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            posts: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Contar mídias
    const mediaCounts = await prisma.post.groupBy({
      by: ['mediaType'],
      where: { creatorId: id },
      _count: true,
    });

    const photos = mediaCounts.find(m => m.mediaType === 'IMAGE')?._count || 0;
    const videos = mediaCounts.find(m => m.mediaType === 'VIDEO')?._count || 0;

    // Formatar resposta
    const response = {
      id: creator.id,
      userId: creator.userId,
      username: creator.user.username,
      displayName: creator.displayName || creator.user.displayName,
      bio: creator.user.bio,
      description: creator.description,
      avatar: creator.user.avatar,
      coverImage: creator.coverImage,
      isVerified: creator.isVerified || creator.user.isVerified,
      subscriptionPrice: creator.subscriptionPrice,
      genderIdentity: creator.user.genderIdentity,
      orientation: creator.user.orientation,
      location: 'Brasil',
      joinDate: creator.user.createdAt,
      socialLinks: creator.socialLinks,
      subscribers: creator._count.subscriptions,
      posts: creator._count.posts,
      photos,
      videos,
      tags: extractTags(creator.description),
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Get creator profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creator profile',
    });
  }
};

/**
 * Obter posts do criador
 */
export const getCreatorPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { limit = 20, offset = 0 } = req.query;

    // Verificar se usuário está inscrito
    let isSubscribed = false;
    if (userId) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          creatorId: id,
          status: 'ACTIVE',
        },
      });
      isSubscribed = !!subscription;
    }

    // Buscar posts
    const posts = await prisma.post.findMany({
      where: {
        creatorId: id,
        ...(!isSubscribed && { isPublic: true }),
      },
      select: {
        id: true,
        title: true,
        mediaUrls: true,
        mediaType: true,
        isPublic: true,
        isPPV: true,
        ppvPrice: true,
        likesCount: true,
        commentsCount: true,
        viewsCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Formatar posts
    const formattedPosts = posts.map(post => {
      const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];
      const thumbnail = mediaUrls[0] || 'https://placehold.co/300x300/6366F1/white?text=Post';

      return {
        id: post.id,
        type: post.mediaType.toLowerCase(),
        thumbnail,
        likes: post.likesCount,
        comments: post.commentsCount,
        views: post.viewsCount,
        isLocked: ! post.isPublic && ! isSubscribed,
        isPPV: post.isPPV,
        price: post.ppvPrice,
        createdAt: post.createdAt,
      };
    });

    res. json({
      success: true,
      data: formattedPosts,
      isSubscribed,
    });
  } catch (error) {
    logger.error('Get creator posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts',
    });
  }
};

/**
 * Listar criadores (discovery/explore)
 */
export const listCreators = async (req, res) => {
  try {
    const { 
      search, 
      minPrice, 
      maxPrice, 
      verified,
      limit = 20, 
      offset = 0 
    } = req.query;

    const where = {
      ...(verified === 'true' && { isVerified: true }),
      ...(minPrice || maxPrice ? {
        subscriptionPrice: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      } : {}),
      ...(search && {
        OR: [
          { displayName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { user: { username: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const creators = await prisma.creator.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            avatar: true,
            bio: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
            posts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.creator.count({ where });

    const formattedCreators = creators.map(creator => ({
      id: creator.id,
      username: creator.user.username,
      displayName: creator.displayName || creator.user.displayName,
      bio: creator.user.bio,
      avatar: creator.user.avatar,
      coverImage: creator.coverImage,
      isVerified: creator.isVerified || creator.user.isVerified,
      subscriptionPrice: creator.subscriptionPrice,
      subscribers: creator._count.subscriptions,
      posts: creator._count. posts,
    }));

    res.json({
      success: true,
      data: formattedCreators,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error('List creators error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list creators',
    });
  }
};

/**
 * Helper: Extrair tags da descrição
 */
function extractTags(description) {
  if (!description) return [];
  
  const hashtagRegex = /#(\w+)/g;
  const matches = description.match(hashtagRegex);
  
  if (!matches) return [];
  
  return matches.map(tag => tag.substring(1)).slice(0, 5);
}