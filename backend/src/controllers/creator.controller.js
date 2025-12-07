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

    // ✅ CORREÇÃO: Buscar total ANTES de buscar criadores
    const total = await prisma.creator.count({ where });

    const creators = await prisma.creator.findMany({
      where,
      skip,
      take: parseInt(limit),
      // ✅ CORREÇÃO: Ordenar pela contagem de subscriptions ou createdAt
      orderBy: featured === 'true' 
        ? { subscriptions: { _count: 'desc' } }  // Ordena por número de assinantes
        : { createdAt: 'desc' },  // Ordena por mais recentes
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
            subscriptions: {
              where: {
                status: 'ACTIVE',  // Contar apenas assinantes ativos
              },
            },
            posts: true,
          },
        },
      },
    });

    // ✅ CORREÇÃO: Formatar criadores usando _count
    const formattedCreators = creators.map((creator) => ({
      id: creator.id,
      userId: creator.userId,
      username: creator.user.username,
      displayName: creator.displayName || creator.user.displayName,
      avatar: creator.user.avatar,
      cover: creator.coverImage,
      bio: creator.user.bio || creator.description,
      category: creator.category,
      subscriptionPrice: parseFloat(creator.subscriptionPrice),
      subscribers: creator._count.subscriptions,  // ✅ Usar _count
      isVerified: creator.user.isVerified,
      posts: creator._count.posts,
      photos: 0,  // Calcular depois se necessário
      videos: 0,  // Calcular depois se necessário
    }));

    res.json({
      success: true,
      data: formattedCreators,  // ✅ CORREÇÃO: Usar formattedCreators
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

    // Contar fotos e vídeos (usando mediaType do schema)
    const [photoCount, videoCount] = await Promise.all([
      prisma.post.count({
        where: {
          creatorId: creator.id,
          mediaType: 'IMAGE',  // ✅ Usar mediaType do schema
        },
      }),
      prisma. post.count({
        where: {
          creatorId: creator.id,
          mediaType: 'VIDEO',  // ✅ Usar mediaType do schema
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
      posts: creator._count. posts,
      photos: photoCount,
      videos: videoCount,
      
      // Subscription
      subscriptionPrice: parseFloat(creator.subscriptionPrice),
      currency: 'USD',
      
      // Info
      category: creator.category,
      tags: [], // Schema não tem tags
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
      type, // IMAGE, VIDEO, AUDIO
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
    };

    // ✅ CORREÇÃO: Usar mediaType do schema (IMAGE, VIDEO, AUDIO, DOCUMENT)
    if (type) {
      where.mediaType = type.toUpperCase();
    }

    // Buscar posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },  // ✅ Usar createdAt
        select: {
          id: true,
          mediaType: true,
          title: true,
          content: true,
          mediaUrls: true,
          isPublic: true,
          isPPV: true,
          ppvPrice: true,
          likesCount: true,
          commentsCount: true,
          viewsCount: true,
          createdAt: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Formatar posts (bloquear conteúdo se não inscrito)
    const formattedPosts = posts.map((post) => {
      const isLocked = !post.isPublic && !isSubscribed;
      
      return {
        id: post.id,
        type: post.mediaType.toLowerCase(),
        title: isLocked ?  'Conteúdo Exclusivo' : (post.title || 'Sem título'),
        description: isLocked ? 'Assine para visualizar' : post.content,
        thumbnail: Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : null,
        isLocked,
        price: post.isPPV ? parseFloat(post.ppvPrice) : null,
        mediaCount: Array.isArray(post.mediaUrls) ? post.mediaUrls.length : 0,
        likes: post.likesCount,
        comments: post.commentsCount,
        views: post.viewsCount,
        publishedAt: post.createdAt,
        tags: [],
        visibility: post.isPPV ? 'ppv' : (post.isPublic ? 'public' : 'subscribers'),
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