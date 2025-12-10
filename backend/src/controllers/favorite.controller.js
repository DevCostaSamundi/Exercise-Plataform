import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get user's favorite creators
 */
export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const favorites = await prisma.favorite.findMany({
      where: { userId },
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    });

    const total = await prisma.favorite.count({ where: { userId } });

    res.json({
      success: true,
      data: favorites.map(f => ({
        id: f.id,
        creatorId: f.creatorId,
        creator: {
          id: f.creator.id,
          username: f.creator.user.username,
          displayName: f.creator.displayName || f.creator.user.displayName,
          avatar: f.creator.user.avatar,
          subscriptionPrice: f.creator.subscriptionPrice,
          isVerified: f.creator.isVerified,
        },
        createdAt: f.createdAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
    });
  }
};

/**
 * Add creator to favorites
 */
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { creatorId } = req.params;

    // Check if creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findFirst({
      where: {
        userId,
        creatorId,
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Creator already in favorites',
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        creatorId,
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

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Creator added to favorites',
    });
  } catch (error) {
    logger.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add favorite',
    });
  }
};

/**
 * Remove creator from favorites
 */
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { creatorId } = req.params;

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        creatorId,
      },
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found',
      });
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    res.json({
      success: true,
      message: 'Creator removed from favorites',
    });
  } catch (error) {
    logger.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove favorite',
    });
  }
};

/**
 * Check if creator is favorited
 */
export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { creatorId } = req.params;

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        creatorId,
      },
    });

    res.json({
      success: true,
      data: {
        isFavorite: !!favorite,
        favorite: favorite || null,
      },
    });
  } catch (error) {
    logger.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status',
    });
  }
};

export default {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
};
