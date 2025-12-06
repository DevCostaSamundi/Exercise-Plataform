import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Listar criadores (público)
 */
export const listCreators = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      featured,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      user: {
        isActive: true,
      },
    };

    if (category) {
      where.category = category;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const creators = await prisma.creator.findMany({
      where,
      take: parseInt(limit),
      orderBy: featured ? { subscribers: 'desc' } : { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    });

    const formattedCreators = creators.map((creator) => ({
      id: creator.id,
      userId: creator.userId,
      username: creator.user.username,
      displayName: creator.displayName || creator.user.displayName,
      avatar: creator.user.avatar,
      cover: creator.coverImage,
      bio: creator.bio,
      category: creator.category,
      subscriptionPrice: creator.subscriptionPrice,
      subscribers: creator.subscribers,
      isVerified: creator.user.isVerified,
      posts: creator.totalPosts || 0,
      photos: creator.totalPhotos || 0,
      videos: creator.totalVideos || 0,
    }));

    res.json({
      success: true,
      data: creators,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('List creators error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list creators',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Obter perfil público do criador
 */
export const getCreatorProfile = async (req, res) => {
  try {
    const { creatorId } = req.params;

    // Buscar criador
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: {
        user: {
          select: {
            id: true,
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
            subscriptions: {
              where: {
                status: 'ACTIVE',
              },
            },
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

    // Contar fotos e vídeos
    const [photoCount, videoCount] = await Promise.all([
      prisma.post.count({
        where: {
          creatorId: creator.id,
          type: 'PHOTO',
          status: 'PUBLISHED',
        },
      }),
      prisma.post.count({
        where: {
          creatorId: creator.id,
          type: 'VIDEO',
          status: 'PUBLISHED',
        },
      }),
    ]);

    // Formatar resposta
    const profile = {
      id: creator.id,
      userId: creator.userId,
      username: creator.user.username,
      displayName: creator.displayName || creator.user.displayName,
      bio: creator.user.bio,
      description: creator.description,
      avatar: creator.user.avatar,
      coverImage: creator.coverImage,
      isVerified: creator.user.isVerified,
      
      // Stats
      subscribers: creator._count.subscriptions,
      posts: creator._count.posts,
      photos: photoCount,
      videos: videoCount,
      
      // Subscription
      subscriptionPrice: creator.subscriptionPrice,
      currency: 'USD',
      
      // Info
      category: creator.category,
      tags: creator.tags || [],
      genderIdentity: creator.user.genderIdentity,
      orientation: creator.user.orientation,
      location: creator.location,
      website: creator.website,
      socialLinks: creator.socialLinks || {},
      joinDate: creator.user.createdAt,
    };

    res.json({
      success: true,
      data: profile,
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
 * Obter posts do criador (público com limitação)
 */
export const getCreatorPosts = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const {
      page = 1,
      limit = 20,
      type, // PHOTO, VIDEO, AUDIO
    } = req.query;

    const userId = req.user?.id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verificar se o criador existe
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Verificar se o usuário está inscrito
    let isSubscribed = false;
    if (userId) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          creatorId,
          status: 'ACTIVE',
        },
      });
      isSubscribed = !!subscription;
    }

    // Construir filtros
    const where = {
      creatorId,
      status: 'PUBLISHED',
    };

    if (type) {
      where.type = type;
    }

    // Buscar posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          thumbnail: true,
          visibility: true,
          price: true,
          mediaCount: true,
          likes: true,
          comments: true,
          views: true,
          publishedAt: true,
          tags: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Formatar posts (bloquear conteúdo se não inscrito)
    const formattedPosts = posts.map((post) => {
      const isLocked = post.visibility === 'SUBSCRIBERS' && !isSubscribed;
      
      return {
        id: post.id,
        type: post.type.toLowerCase(),
        title: isLocked ? 'Conteúdo Exclusivo' : post.title,
        description: isLocked ? 'Assine para visualizar' : post.description,
        thumbnail: post.thumbnail,
        isLocked,
        price: post.visibility === 'PPV' ? post.price : null,
        mediaCount: post.mediaCount,
        likes: post.likes,
        comments: post.comments,
        views: post.views,
        publishedAt: post.publishedAt,
        tags: post.tags,
        visibility: post.visibility.toLowerCase(),
      };
    });

    res.json({
      success: true,
      data: formattedPosts,
      isSubscribed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get creator posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creator posts',
    });
  }
};