import prisma from '../config/database.js';
import ApiResponse from '../utils/response.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

class PostController {
  /**
   * Get all posts
   */
  async getPosts(req, res, next) {
    try {
      const { page = 1, limit = 20, creatorId, mediaType, isPublic } = req.query;
      const skip = (page - 1) * limit;

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
          take: parseInt(limit),
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
        { page: parseInt(page), limit: parseInt(limit), total },
        'Posts retrieved successfully'
      );
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
      if (!post.isPublic && (!req.user || req.user.role !== 'ADMIN')) {
        // Check if user is subscribed to creator
        if (req.user) {
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
        } else {
          throw new ForbiddenError('This content is for subscribers only');
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

  /**
   * Create new post
   */
  async createPost(req, res, next) {
    try {
      const { title, content, mediaType, isPublic, isPPV, ppvPrice } = req.body;

      // Get creator profile
      const creator = await prisma.creator.findUnique({
        where: { userId: req.user.id },
      });

      if (!creator) {
        throw new ForbiddenError('Only creators can create posts');
      }

      const post = await prisma.post.create({
        data: {
          creatorId: creator.id,
          title,
          content,
          mediaType,
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

      // Get post
      const post = await prisma.post.findUnique({
        where: { id },
        include: { creator: true },
      });

      if (!post) {
        throw new NotFoundError('Post not found');
      }

      // Check ownership
      if (post.creator.userId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('You can only update your own posts');
      }

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

      // Get post
      const post = await prisma.post.findUnique({
        where: { id },
        include: { creator: true },
      });

      if (!post) {
        throw new NotFoundError('Post not found');
      }

      // Check ownership
      if (post.creator.userId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('You can only delete your own posts');
      }

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
