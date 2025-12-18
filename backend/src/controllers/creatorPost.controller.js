import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

/**
 * Obter meus posts (como criador)
 * GET /api/v1/creator/posts
 */
export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'all', page = 1, limit = 50 } = req.query;

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
    const where = { creatorId: creator.id };

    if (status !== 'all') {
      if (status === 'published') {
        where.isPublished = true;
        where.scheduledFor = null;
      } else if (status === 'scheduled') {
        where.scheduledFor = { not: null };
      } else if (status === 'draft') {
        where.isPublished = false;
        where.scheduledFor = null;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Buscar posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.post.count({ where }),
    ]);

    // Calcular estatísticas
    const stats = {
      all: await prisma.post.count({ where: { creatorId: creator.id } }),
      published: await prisma.post.count({
        where: {
          creatorId: creator.id,
          isPublished: true,
          scheduledFor: null,
        },
      }),
      scheduled: await prisma.post.count({
        where: {
          creatorId: creator.id,
          scheduledFor: { not: null },
        },
      }),
      draft: await prisma.post.count({
        where: {
          creatorId: creator.id,
          isPublished: false,
          scheduledFor: null,
        },
      }),
    };

    // Formatar posts
    const formatted = posts.map(post => ({
      id: post.id,
      title: post.title || 'Sem título',
      description: post.caption || '',
      thumbnail: Array.isArray(post.mediaUrl) ? post.mediaUrl[0] : post.mediaUrl,
      type: post.mediaType || 'photo',
      mediaCount: Array.isArray(post.mediaUrl) ? post.mediaUrl.length : 1,
      status: getPostStatus(post),
      visibility: post.isPPV ? 'premium' : post.subscribersOnly ? 'subscribers' : 'free',
      likes: post._count?.likes || 0,
      comments: post._count?.comments || 0,
      views: post.viewsCount || 0,
      earnings: post.earnings || 0,
      tags: post.tags || [],
      publishedAt: post.publishedAt || post.createdAt,
      scheduledFor: post.scheduledFor,
      createdAt: post.createdAt,
    }));

    res.json({
      success: true,
      data: formatted,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching my posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
    });
  }
};

/**
 * Criar novo post
 * POST /api/v1/creator/posts
 */
export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      caption,
      mediaUrl, // Array de URLs ou URL única
      mediaType, // 'photo', 'video', 'audio'
      isPPV,
      price,
      subscribersOnly,
      tags,
      scheduledFor,
      title,
    } = req.body;

    logger.info('📝 Creating post:', {
      userId,
      caption: caption?.substring(0, 50),
      mediaType,
      isPPV,
      hasSchedule: !!scheduledFor,
    });

    // Validações
    if (!mediaUrl || (Array.isArray(mediaUrl) && mediaUrl.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Media URL is required',
      });
    }

    if (isPPV && (!price || price < 1)) {
      return res.status(400).json({
        success: false,
        message: 'PPV posts require a valid price',
      });
    }

    // Buscar criador
    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found.  Please complete creator registration.',
      });
    }

    // Determinar se deve ser publicado imediatamente
    const shouldPublish = !scheduledFor;
    const publishDate = shouldPublish ? new Date() : null;

    // Criar post
    const post = await prisma.post.create({
      data: {
        creatorId: creator.id,
        caption: caption || '',
        title: title || caption?.substring(0, 100) || 'Post sem título',
        mediaUrl: Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl],
        mediaType: mediaType || 'photo',
        isPPV: isPPV || false,
        price: isPPV ? parseFloat(price) : null,
        subscribersOnly: subscribersOnly ?? true,
        tags: tags || [],
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        isPublished: shouldPublish,
        publishedAt: publishDate,
        viewsCount: 0,
        likesCount: 0,
        commentsCount: 0,
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
      },
    });

    logger.info('✅ Post created successfully:', {
      postId: post.id,
      creatorId: creator.id,
      isPublished: post.isPublished,
      scheduledFor: post.scheduledFor,
    });

    // Formatar resposta
    const formatted = {
      id: post.id,
      title: post.title,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      isPPV: post.isPPV,
      price: post.price,
      subscribersOnly: post.subscribersOnly,
      tags: post.tags,
      status: getPostStatus(post),
      isPublished: post.isPublished,
      publishedAt: post.publishedAt,
      scheduledFor: post.scheduledFor,
      createdAt: post.createdAt,
      creator: {
        id: post.creator.id,
        username: post.creator.user.username,
        displayName: post.creator.user.displayName,
        avatar: post.creator.user.avatar,
      },
    };

    res.status(201).json({
      success: true,
      message: shouldPublish ? 'Post published successfully' : 'Post scheduled successfully',
      data: formatted,
    });
  } catch (error) {
    logger.error('❌ Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Atualizar post
 * PUT /api/v1/creator/posts/:id
 */
export const updatePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

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

    // Verificar se o post existe e pertence ao criador
    const existingPost = await prisma.post.findFirst({
      where: {
        id,
        creatorId: creator.id,
      },
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to edit it',
      });
    }

    // Preparar dados para atualização
    const dataToUpdate = {};

    if (updateData.caption !== undefined) dataToUpdate.caption = updateData.caption;
    if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
    if (updateData.mediaUrl !== undefined) {
      dataToUpdate.mediaUrl = Array.isArray(updateData.mediaUrl)
        ? updateData.mediaUrl
        : [updateData.mediaUrl];
    }
    if (updateData.mediaType !== undefined) dataToUpdate.mediaType = updateData.mediaType;
    if (updateData.isPPV !== undefined) dataToUpdate.isPPV = updateData.isPPV;
    if (updateData.price !== undefined) dataToUpdate.price = updateData.isPPV ? parseFloat(updateData.price) : null;
    if (updateData.subscribersOnly !== undefined) dataToUpdate.subscribersOnly = updateData.subscribersOnly;
    if (updateData.tags !== undefined) dataToUpdate.tags = updateData.tags;

    // Lógica de publicação/agendamento
    if (updateData.scheduledFor !== undefined) {
      if (updateData.scheduledFor) {
        dataToUpdate.scheduledFor = new Date(updateData.scheduledFor);
        dataToUpdate.isPublished = false;
        dataToUpdate.publishedAt = null;
      } else {
        dataToUpdate.scheduledFor = null;
        if (!existingPost.isPublished) {
          dataToUpdate.isPublished = true;
          dataToUpdate.publishedAt = new Date();
        }
      }
    }

    // Atualizar post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: dataToUpdate,
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    logger.info('✅ Post updated:', { postId: id, creatorId: creator.id });

    // Formatar resposta
    const formatted = {
      id: updatedPost.id,
      title: updatedPost.title,
      caption: updatedPost.caption,
      mediaUrl: updatedPost.mediaUrl,
      mediaType: updatedPost.mediaType,
      isPPV: updatedPost.isPPV,
      price: updatedPost.price,
      subscribersOnly: updatedPost.subscribersOnly,
      tags: updatedPost.tags,
      status: getPostStatus(updatedPost),
      likes: updatedPost._count?.likes || 0,
      comments: updatedPost._count?.comments || 0,
      views: updatedPost.viewsCount || 0,
      publishedAt: updatedPost.publishedAt,
      scheduledFor: updatedPost.scheduledFor,
      updatedAt: updatedPost.updatedAt,
    };

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: formatted,
    });
  } catch (error) {
    logger.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post',
    });
  }
};

/**
 * Deletar post
 * DELETE /api/v1/creator/posts/:id
 */
export const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

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

    // Verificar se o post existe e pertence ao criador
    const post = await prisma.post.findFirst({
      where: {
        id,
        creatorId: creator.id,
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission to delete it',
      });
    }

    // Deletar post (isso também deleta likes, comments, etc devido ao cascade)
    await prisma.post.delete({
      where: { id },
    });

    logger.info('✅ Post deleted:', { postId: id, creatorId: creator.id });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
    });
  }
};

/**
 * Deletar múltiplos posts
 * POST /api/v1/creator/posts/bulk-delete
 */
export const bulkDeletePosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postIds } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post IDs array is required',
      });
    }

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

    // Deletar posts que pertencem ao criador
    const result = await prisma.post.deleteMany({
      where: {
        id: { in: postIds },
        creatorId: creator.id,
      },
    });

    logger.info('✅ Bulk delete completed:', {
      requestedCount: postIds.length,
      deletedCount: result.count,
      creatorId: creator.id,
    });

    res.json({
      success: true,
      message: `${result.count} post(s) deleted successfully`,
      deletedCount: result.count,
    });
  } catch (error) {
    logger.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete posts',
    });
  }
};

// Helper function
function getPostStatus(post) {
  if (post.scheduledFor && new Date(post.scheduledFor) > new Date()) {
    return 'scheduled';
  }
  if (post.isPublished) {
    return 'published';
  }
  return 'draft';
}

export default {
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  bulkDeletePosts,
};