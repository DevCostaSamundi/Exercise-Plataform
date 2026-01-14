import prisma from '../config/database.js';
import ApiResponse from '../utils/response.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

class PostController {
  /**
   * Helper to verify post ownership
   */
  async #verifyPostOwnership(postId, userId, userRole) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { creator: true },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.creator.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You can only modify your own posts');
    }

    return post;
  }

  /**
   * Get all posts
   */
  async getPosts(req, res, next) {
    try {
      const { page = 1, limit = 20, creatorId, mediaType, isPublic } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const where = {};

      if (creatorId) {
        where.creatorId = creatorId;
      }

      if (mediaType) {
        where.mediaType = mediaType;
      }

      if (isPublic !== undefined) {
        where.isPublic = isPublic === 'true';
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            creator: {
              include: {
                user: {
                  select: {
                    username: true,
                    avatar: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.post.count({ where }),
      ]);

      return ApiResponse.paginated(
        res,
        posts,
        { page: pageNum, limit: limitNum, total },
        'Posts retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }


  /**
 * Get current creator's posts
 */
  async getMyPosts(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Get creator profile
      const creator = await prisma.creator.findUnique({
        where: { userId: req.user.id },
      });

      if (!creator) {
        throw new ForbiddenError('Only creators can access this');
      }

      const where = { creatorId: creator.id };

      // Filter by status if provided
      if (status && status !== 'all') {
        where.status = status.toUpperCase();
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.post.count({ where }),
      ]);

      // Calculate stats
      const stats = {
        all: await prisma.post.count({ where: { creatorId: creator.id } }),
        published: await prisma.post.count({ where: { creatorId: creator.id, status: 'PUBLISHED' } }),
        scheduled: await prisma.post.count({ where: { creatorId: creator.id, status: 'SCHEDULED' } }),
        draft: await prisma.post.count({ where: { creatorId: creator.id, status: 'DRAFT' } }),
      };

      return ApiResponse.success(res, {
        data: posts,
        stats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      }, 'Posts retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get post by ID
   */
  async getPostById(req, res, next) {
    try {
      const { id } = req.params;

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          creator: {
            include: {
              user: {
                select: {
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!post) {
        throw new NotFoundError('Post not found');
      }

      // Check access for private posts
      if (!post.isPublic) {
        // Admins have access to all content
        if (req.user?.role === 'ADMIN') {
          // Admin access granted
        } else if (!req.user) {
          throw new ForbiddenError('This content is for subscribers only');
        } else {
          // Check if user is subscribed to creator
          const subscription = await prisma.subscription.findFirst({
            where: {
              userId: req.user.id,
              creatorId: post.creatorId,
              status: 'ACTIVE',
            },
          });

          if (!subscription) {
            throw new ForbiddenError('This content is for subscribers only');
          }
        }
      }

      // Increment views
      await prisma.post.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      });

      return ApiResponse.success(res, post, 'Post retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Adicionar dentro da classe PostController

  /**
   * Bulk delete posts
   */
  async bulkDeletePosts(req, res, next) {
    try {
      const { postIds } = req.body;

      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return ApiResponse.error(res, 'IDs de posts não fornecidos', 400);
      }

      // Get creator profile
      const creator = await prisma.creator.findUnique({
        where: { userId: req.user.id },
      });

      if (!creator) {
        throw new ForbiddenError('Only creators can delete posts');
      }

      // Verificar se todos os posts pertencem ao criador
      const posts = await prisma.post.findMany({
        where: {
          id: { in: postIds },
          creatorId: creator.id,
        },
      });

      if (posts.length !== postIds.length) {
        throw new ForbiddenError('Some posts do not belong to you');
      }

      // Deletar posts
      const deleteResult = await prisma.post.deleteMany({
        where: {
          id: { in: postIds },
          creatorId: creator.id,
        },
      });

      // Atualizar contador de posts do criador
      await prisma.creator.update({
        where: { id: creator.id },
        data: { postsCount: { decrement: deleteResult.count } },
      });

      return ApiResponse.success(
        res,
        { deletedCount: deleteResult.count },
        `${deleteResult.count} post(s) deleted successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new post
   */
  async createPost(req, res, next) {
    try {
      const {
        title,
        content,
        mediaUrls,      // ← Array de URLs
        mediaType,
        isPublic,
        isPPV,
        ppvPrice,
        tags,
        scheduledFor
      } = req.body;

      // Validação básica
      if (!title || !content) {
        return ApiResponse.error(res, 'Título e conteúdo são obrigatórios', 400);
      }

      if (!mediaUrls || mediaUrls.length === 0) {
        return ApiResponse.error(res, 'Pelo menos uma mídia é obrigatória', 400);
      }

      // Get creator profile
      const creator = await prisma.creator.findUnique({
        where: { userId: req.user.id },
      });

      if (!creator) {
        throw new ForbiddenError('Only creators can create posts');
      }

      // Determinar status do post
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
          title,
          content,
          mediaUrls,         // Salvar array de URLs
          mediaType,
          isPublic: isPublic || false,
          isPPV: isPPV || false,
          ppvPrice: isPPV ? ppvPrice : null,
          tags: tags || [],
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          status,
        },
      });

      // Increment creator's post count
      await prisma.creator.update({
        where: { id: creator.id },
        data: { postsCount: { increment: 1 } },
      });

      return ApiResponse.success(res, post, 'Post created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update post
   */
  async updatePost(req, res, next) {
    try {
      const { id } = req.params;
      const { title, content, isPublic, isPPV, ppvPrice } = req.body;

      // Verify ownership
      await this.#verifyPostOwnership(id, req.user.id, req.user.role);

      const updatedPost = await prisma.post.update({
        where: { id },
        data: {
          title,
          content,
          isPublic,
          isPPV,
          ppvPrice,
        },
        include: {
          creator: {
            include: {
              user: {
                select: {
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return ApiResponse.success(res, updatedPost, 'Post updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete post
   */
  async deletePost(req, res, next) {
    try {
      const { id } = req.params;

      // Verify ownership
      const post = await this.#verifyPostOwnership(id, req.user.id, req.user.role);

      await prisma.post.delete({
        where: { id },
      });

      // Decrement creator's post count
      await prisma.creator.update({
        where: { id: post.creatorId },
        data: { postsCount: { decrement: 1 } },
      });

      return ApiResponse.success(res, null, 'Post deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new PostController();
