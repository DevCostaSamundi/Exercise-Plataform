import prisma from '../config/database.js';
import ApiResponse from '../utils/response.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';

class CreatorController {
  /**
   * Helper to verify creator ownership
   */
  async #verifyCreatorOwnership(creatorId, userId, userRole) {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      throw new NotFoundError('Creator not found');
    }

    if (creator.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You can only modify your own creator profile');
    }

    return creator;
  }

  /**
   * Get all creators
   */
  async getCreators(req, res, next) {
    try {
      const { page = 1, limit = 20, verified } = req.query;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const where = {};
      if (verified !== undefined) {
        where.isVerified = verified === 'true';
      }

      const [creators, total] = await Promise.all([
        prisma.creator.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            followersCount: 'desc',
          },
        }),
        prisma.creator.count({ where }),
      ]);

      return ApiResponse.paginated(
        res,
        creators,
        { page: pageNum, limit: limitNum, total },
        'Creators retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get creator by ID
   */
  async getCreatorById(req, res, next) {
    try {
      const { id } = req.params;

      const creator = await prisma.creator.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              username: true,
              avatar: true,
              bio: true,
            },
          },
          _count: {
            select: {
              posts: true,
              products: true,
              subscriptions: true,
            },
          },
        },
      });

      if (!creator) {
        throw new NotFoundError('Creator not found');
      }

      return ApiResponse.success(res, creator, 'Creator retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Become a creator (upgrade user to creator)
   */
  async becomeCreator(req, res, next) {
    try {
      const { displayName, description, subscriptionPrice } = req.body;

      // Check if user is already a creator
      const existingCreator = await prisma.creator.findUnique({
        where: { userId: req.user.id },
      });

      if (existingCreator) {
        throw new ConflictError('User is already a creator');
      }

      // Create creator profile
      const creator = await prisma.creator.create({
        data: {
          userId: req.user.id,
          displayName,
          description,
          subscriptionPrice: subscriptionPrice || 0,
        },
        include: {
          user: {
            select: {
              username: true,
              avatar: true,
            },
          },
        },
      });

      // Update user role
      await prisma.user.update({
        where: { id: req.user.id },
        data: { role: 'CREATOR' },
      });

      return ApiResponse.success(
        res,
        creator,
        'Creator profile created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update creator profile
   */
  async updateCreator(req, res, next) {
    try {
      const { id } = req.params;
      const { displayName, description, coverImage, subscriptionPrice, socialLinks } = req.body;

      // Verify ownership
      await this.#verifyCreatorOwnership(id, req.user.id, req.user.role);

      // Update creator
      const updatedCreator = await prisma.creator.update({
        where: { id },
        data: {
          displayName,
          description,
          coverImage,
          subscriptionPrice,
          socialLinks,
        },
        include: {
          user: {
            select: {
              username: true,
              avatar: true,
            },
          },
        },
      });

      return ApiResponse.success(
        res,
        updatedCreator,
        'Creator profile updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get creator statistics
   */
  async getCreatorStats(req, res, next) {
    try {
      const { id } = req.params;

      // Verify ownership
      await this.#verifyCreatorOwnership(id, req.user.id, req.user.role);

      const stats = await prisma.creator.findUnique({
        where: { id },
        select: {
          earnings: true,
          followersCount: true,
          postsCount: true,
          _count: {
            select: {
              posts: true,
              products: true,
              subscriptions: true,
            },
          },
        },
      });

      return ApiResponse.success(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new CreatorController();
