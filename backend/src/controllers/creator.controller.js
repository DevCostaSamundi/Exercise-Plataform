import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * GET /api/v1/creators
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

    const total = await prisma.creator.count({ where });

    const creators = await prisma.creator.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
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
                status: 'ACTIVE',
              },
            },
            posts: true,
          },
        },
      },
    });

    const formattedCreators = creators.map((creator) => ({
      id: creator.id,
      userId: creator.userId,
      username: creator.user.username,
      displayName: creator.displayName || creator.user.displayName,
      avatar: creator.user.avatar || 'https://via.placeholder.com/150',
      cover: creator.coverImage || 'https://via.placeholder.com/1500x500',
      bio: creator.user.bio || creator.description || '',
      category: creator.category || 'Outros',
      subscriptionPrice: creator.subscriptionPrice != null ? parseFloat(creator.subscriptionPrice) : 0,
      subscribers: creator._count.subscriptions,
      isVerified: creator.user.isVerified || false,
      posts: creator._count.posts,
    }));

    res.json({
      success: true,
      data: formattedCreators,
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
    });
  }
};

/**
 * GET /api/v1/creators/username/:username
 * Obter perfil público completo por username
 */
export const getCreatorByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;

    const creator = await prisma.creator.findFirst({
      where: {
        user: {
          username: username,
        },
      },
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

    // Verificar se está inscrito
    let isSubscribed = false;
    if (currentUserId) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: currentUserId,
          creatorId: creator.id,
          status: 'ACTIVE',
        },
      });
      isSubscribed = !!subscription;
    }

    // Contar fotos e vídeos
    const [photosCount, videosCount] = await Promise.all([
      prisma.post.count({
        where: {
          creatorId: creator.id,
          mediaType: 'IMAGE',
        },
      }),
      prisma.post.count({
        where: {
          creatorId: creator.id,
          mediaType: 'VIDEO',
        },
      }),
    ]);

    // Formatar resposta COMPLETA
    const profile = {
      id: creator.id,
      userId: creator.user.id,
      username: creator.user.username,
      displayName: creator.displayName || creator.user.displayName || 'Criador',
      avatar: creator.user.avatar || 'https://via.placeholder.com/150',
      cover: creator.coverImage || 'https://via.placeholder.com/1500x500',
      bio: creator.user.bio || '',
      description: creator.description || '',

      // Informações pessoais
      genderIdentity: creator.user.genderIdentity || 'Não informado',
      orientation: creator.user.orientation || 'Não informado',
      location: creator.location || 'Não informado',
      website: creator.website || '',
      category: creator.category || 'Outros',

      // Redes sociais
      socialLinks: creator.socialLinks || {},

      // Tags (extrair da categoria)
      tags: creator.category ? [creator.category.toLowerCase()] : ['creator'],

      // Status
      isVerified: creator.user.isVerified || false,
      featured: creator.featured || false,

      // Estatísticas
      subscribers: creator._count.subscriptions,
      posts: creator._count.posts,
      photos: photosCount,
      videos: videosCount,

      // Assinatura
      subscriptionPrice: creator.subscriptionPrice != null ? parseFloat(creator.subscriptionPrice) : 0,
      currency: 'USD',

      // Datas
      joinDate: new Date(creator.user.createdAt).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      }),

      // Status do usuário atual
      isSubscribed,
    };

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Get creator by username error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creator profile',
    });
  }
};

/**
 * GET /api/v1/creators/:creatorId
 * Obter perfil público completo por ID
 */
export const getCreatorProfile = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const currentUserId = req.user?.id;

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

    // Verificar se está inscrito
    let isSubscribed = false;
    if (currentUserId) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: currentUserId,
          creatorId: creator.id,
          status: 'ACTIVE',
        },
      });
      isSubscribed = !!subscription;
    }

    // Contar fotos e vídeos
    const [photosCount, videosCount] = await Promise.all([
      prisma.post.count({
        where: {
          creatorId: creator.id,
          mediaType: 'IMAGE',
        },
      }),
      prisma.post.count({
        where: {
          creatorId: creator.id,
          mediaType: 'VIDEO',
        },
      }),
    ]);

    // Formatar resposta COMPLETA
    const profile = {
      id: creator.id,
      userId: creator.user.id,
      username: creator.user.username,
      displayName: creator.displayName || creator.user.displayName || 'Criador',
      avatar: creator.user.avatar || 'https://via.placeholder.com/150',
      cover: creator.coverImage || 'https://via.placeholder.com/1500x500',
      bio: creator.user.bio || '',
      description: creator.description || '',

      // Informações pessoais
      genderIdentity: creator.user.genderIdentity || 'Não informado',
      orientation: creator.user.orientation || 'Não informado',
      location: creator.location || 'Não informado',
      website: creator.website || '',
      category: creator.category || 'Outros',

      // Redes sociais
      socialLinks: creator.socialLinks || {},

      // Tags
      tags: creator.category ? [creator.category.toLowerCase()] : ['creator'],

      // Status
      isVerified: creator.user.isVerified || false,
      featured: creator.featured || false,

      // Estatísticas
      subscribers: creator._count.subscriptions,
      posts: creator._count.posts,
      photos: photosCount,
      videos: videosCount,

      // Assinatura
      subscriptionPrice: creator.subscriptionPrice != null ? parseFloat(creator.subscriptionPrice) : 0,
      currency: 'USD',

      // Datas
      joinDate: new Date(creator.user.createdAt).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      }),

      isSubscribed,
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
 * GET /api/v1/creators/username/:username/posts
 * Obter posts do criador por username
 */
export const getCreatorPostsByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const {
      page = 1,
      limit = 20,
      type,
    } = req.query;

    const userId = req.user?.id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Buscar criador
    const creator = await prisma.creator.findFirst({
      where: {
        user: {
          username: username,
        },
      },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Verificar inscrição
    let isSubscribed = false;
    if (userId) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          creatorId: creator.id,
          status: 'ACTIVE',
        },
      });
      isSubscribed = !!subscription;
    }

    // Construir filtros
    const where = {
      creatorId: creator.id,
    };

    if (type) {
      where.mediaType = type.toUpperCase();
    }

    // Buscar posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
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

    // Formatar posts
    const formattedPosts = posts.map((post) => {
      const isLocked = !post.isPublic && !isSubscribed;

      return {
        id: post.id,
        type: post.mediaType.toLowerCase(),
        title: isLocked ? 'Conteúdo Exclusivo' : (post.title || 'Sem título'),
        description: isLocked ? 'Assine para visualizar' : post.content,
        thumbnail: Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0
          ? post.mediaUrls[0]
          : 'https://via.placeholder.com/600x400',
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
    logger.error('Get creator posts by username error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creator posts',
    });
  }
};

/**
 * GET /api/v1/creators/: creatorId/posts
 * Obter posts do criador por ID
 */
export const getCreatorPosts = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const {
      page = 1,
      limit = 20,
      type,
    } = req.query;

    const userId = req.user?.id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verificar se criador existe
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Verificar inscrição
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

    if (type) {
      where.mediaType = type.toUpperCase();
    }

    // Buscar posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
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

    // Formatar posts
    const formattedPosts = posts.map((post) => {
      const isLocked = !post.isPublic && !isSubscribed;

      return {
        id: post.id,
        type: post.mediaType.toLowerCase(),
        title: isLocked ? 'Conteúdo Exclusivo' : (post.title || 'Sem título'),
        description: isLocked ? 'Assine para visualizar' : post.content,
        thumbnail: Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0
          ? post.mediaUrls[0]
          : 'https://via.placeholder.com/600x400',
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