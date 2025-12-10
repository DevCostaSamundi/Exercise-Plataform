import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Toggle like on a post
 * POST /api/v1/posts/:postId/like
 */
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike: delete the like
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Decrement likes count
      await prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: { decrement: 1 },
        },
      });

      return res.json({
        success: true,
        data: {
          liked: false,
          likesCount: Math.max(0, post.likesCount - 1),
        },
      });
    } else {
      // Like: create a new like
      await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });

      // Increment likes count
      await prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: { increment: 1 },
        },
      });

      return res.json({
        success: true,
        data: {
          liked: true,
          likesCount: post.likesCount + 1,
        },
      });
    }
  } catch (error) {
    logger.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
    });
  }
};

/**
 * Check if user liked a post
 * GET /api/v1/posts/:postId/liked
 */
export const checkLiked = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        likesCount: true,
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user liked the post
    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        liked: !!like,
        likesCount: post.likesCount,
      },
    });
  } catch (error) {
    logger.error('Error checking like status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking like status',
    });
  }
};

export default {
  toggleLike,
  checkLiked,
};
