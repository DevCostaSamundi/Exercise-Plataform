import prisma from '../config/database.js';
import logger from '../utils/logger.js';

// ============================================
// Helper function (apenas UMA vez, no início)
// ============================================
function getPostStatus(post) {
  if (post.status) return post.status.toLowerCase();
  if (post.scheduledFor && new Date(post.scheduledFor) > new Date()) return 'scheduled';
  if (post.isPublished) return 'published';
  return 'draft';
}

/**
 * Obter meus posts (como criador)
 * GET /api/v1/creator/posts
 */
export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'all', page = 1, limit = 50 } = req.query;

    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    const where = { creatorId: creator.id };

    if (status !== 'all') {
      where.status = status.toUpperCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

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

    const stats = {
      all: await prisma.post.count({ where: { creatorId: creator.id } }),
      published: await prisma.post.count({
        where: { creatorId: creator.id, status: 'PUBLISHED' },
      }),
      scheduled: await prisma.post.count({
        where: { creatorId: creator.id, status: 'SCHEDULED' },
      }),
      draft: await prisma.post.count({
        where: { creatorId: creator.id, status: 'DRAFT' },
      }),
    };

    const formatted = posts.map(post => {
      let thumbnailUrl = null;

      try {
        const mediaField = post.mediaUrls;

        if (Array.isArray(mediaField) && mediaField.length > 0) {
          thumbnailUrl = mediaField[0];
        } else if (typeof mediaField === 'string' && mediaField.trim()) {
          try {
            const parsed = JSON.parse(mediaField);
            thumbnailUrl = Array.isArray(parsed) ? parsed[0] : mediaField;
          } catch {
            thumbnailUrl = mediaField;
          }
        } else if (mediaField && typeof mediaField === 'object') {
          const urls = Object.values(mediaField);
          if (urls.length > 0) thumbnailUrl = urls[0];
        }
      } catch (error) {
        logger.warn(`⚠️ Erro thumbnail post ${post.id}:`, error.message);
      }

      return {
        id: post.id,
        title: post.title || 'Sem título',
        description: post.content || '',
        thumbnail: thumbnailUrl,
        type: post.mediaType || 'photo',
        mediaCount: Array.isArray(post.mediaUrls) ? post.mediaUrls.length : 1,
        status: getPostStatus(post),
        visibility: post.isPPV ? 'premium' : post.isPublic === false ? 'subscribers' : 'free',
        likes: post._count?.likes || 0,
        comments: post._count?.comments || 0,
        views: post.viewsCount || 0,
        earnings: 0,
        tags: post.tags || [],
        publishedAt: post.publishedAt || post.createdAt,
        scheduledFor: post.scheduledFor,
        createdAt: post.createdAt,
      };
    });

    logger.info(`✅ Fetched ${formatted.length} posts for creator ${creator.id}`);

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
      title,
      content,
      mediaUrls,
      mediaType,
      isPPV,
      price,
      isPublic,
      tags,
      scheduledFor,
    } = req.body;

    logger.info('📝 Creating post:', { userId, title, mediaType });

    if (!mediaUrls || (Array.isArray(mediaUrls) && mediaUrls.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Media URL is required',
      });
    }

    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    let status = 'PUBLISHED';
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate > new Date()) {
        status = 'SCHEDULED';
      }
    }

    const post = await prisma.post.create({
      data: {
        creatorId: creator.id,
        title: title || 'Post sem título',
        content: content || '',
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [mediaUrls],
        mediaType: mediaType || 'photo',
        isPPV: isPPV || false,
        ppvPrice: isPPV ? parseFloat(price) : null,
        isPublic: isPublic ?? false,
        tags: tags || [],
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status,
        viewsCount: 0,
        likesCount: 0,
        commentsCount: 0,
      },
    });

    logger.info('✅ Post created:', { postId: post.id, creatorId: creator.id });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });
  } catch (error) {
    logger.error('❌ Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
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

    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

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

    const dataToUpdate = {};

    if (updateData.content !== undefined) dataToUpdate.content = updateData.content;
    if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
    if (updateData.mediaUrls !== undefined) {
      dataToUpdate.mediaUrls = Array.isArray(updateData.mediaUrls)
        ? updateData.mediaUrls
        : [updateData.mediaUrls];
    }
    if (updateData.mediaType !== undefined) dataToUpdate.mediaType = updateData.mediaType;
    if (updateData.isPPV !== undefined) dataToUpdate.isPPV = updateData.isPPV;
    if (updateData.price !== undefined) dataToUpdate.ppvPrice = updateData.isPPV ? parseFloat(updateData.price) : null;
    if (updateData.isPublic !== undefined) dataToUpdate.isPublic = updateData.isPublic;
    if (updateData.tags !== undefined) dataToUpdate.tags = updateData.tags;

    if (updateData.scheduledFor !== undefined) {
      if (updateData.scheduledFor) {
        dataToUpdate.scheduledFor = new Date(updateData.scheduledFor);
        dataToUpdate.status = 'SCHEDULED';
      } else {
        dataToUpdate.scheduledFor = null;
        dataToUpdate.status = 'PUBLISHED';
      }
    }

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

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost,
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

    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

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

    const creator = await prisma.creator.findUnique({
      where: { userId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

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

export default {
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  bulkDeletePosts,
};