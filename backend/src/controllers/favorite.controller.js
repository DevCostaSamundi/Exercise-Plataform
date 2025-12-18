import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import ApiResponse from '../utils/response.js';

/**
 * Obter favoritos do usuário
 * GET /api/v1/favorites
 */
export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sort = 'recent' } = req.query;

    let orderBy = {};
    if (sort === 'recent') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'alphabetical') {
      orderBy = { creator: { user: { displayName: 'asc' } } };
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        creator: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy,
    });

    const formatted = favorites.map(fav => ({
      _id: fav.creator.id,
      username: fav.creator.user.username,
      displayName: fav.creator.user.displayName || fav.creator.user.username,
      avatar: fav.creator.user.avatar,
      subscriptionPrice: fav.creator.subscriptionPrice,
      subscriberCount: fav.creator.subscriberCount || 0,
      isVerified: fav.creator.isVerified,
      addedAt: fav.createdAt,
    }));

    res.json({
      success: true,
      favorites: formatted,
    });
  } catch (error) {
    logger.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
    });
  }
};

/**
 * Adicionar criador aos favoritos
 * POST /api/v1/favorites/: creatorId
 */
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { creatorId } = req.params;

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

    // Verificar se já está nos favoritos
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_creatorId: {
          userId,
          creatorId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Creator already in favorites',
      });
    }

    // Adicionar aos favoritos
    await prisma.favorite.create({
      data: {
        userId,
        creatorId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Creator added to favorites',
    });
  } catch (error) {
    logger.error('Error adding favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add favorite',
    });
  }
};

/**
 * Remover criador dos favoritos
 * DELETE /api/v1/favorites/:creatorId
 */
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { creatorId } = req.params;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_creatorId: {
          userId,
          creatorId,
        },
      },
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found',
      });
    }

    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    res.json({
      success: true,
      message: 'Creator removed from favorites',
    });
  } catch (error) {
    logger.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove favorite',
    });
  }
};

/**
 * Verificar se criador está nos favoritos
 * GET /api/v1/favorites/check/:creatorId
 */
export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { creatorId } = req.params;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_creatorId: {
          userId,
          creatorId,
        },
      },
    });

    res.json({
      success: true,
      isFavorited: !!favorite,
    });
  } catch (error) {
    logger.error('Error checking favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite',
    });
  }
};

export default {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
};