import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Add a comment to a post
 * POST /api/v1/posts/:postId/comments
 */
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be less than 500 characters',
      });
    }

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

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    });

    // Increment post comments count
    await prisma.post.update({
      where: { id: postId },
      data: {
        commentsCount: { increment: 1 },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        _id: comment.id,
        content: comment.content,
        author: {
          _id: comment.user.id,
          name: comment.user.displayName || comment.user.username,
          username: comment.user.username,
          avatar: comment.user.avatar,
          isVerified: comment.user.isVerified,
        },
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
    });
  }
};

/**
 * Get comments for a post
 * GET /api/v1/posts/:postId/comments
 */
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

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

    // Fetch comments
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: { postId },
      }),
    ]);

    // Format comments
    const formattedComments = comments.map((comment) => ({
      _id: comment.id,
      content: comment.content,
      author: {
        _id: comment.user.id,
        name: comment.user.displayName || comment.user.username,
        username: comment.user.username,
        avatar: comment.user.avatar,
        isVerified: comment.user.isVerified,
      },
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    res.json({
      success: true,
      data: formattedComments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
    });
  }
};

/**
 * Delete a comment
 * DELETE /api/v1/comments/:commentId
 */
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Find comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            id: true,
            creatorId: true,
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user is the comment author or the post creator
    if (comment.userId !== userId && comment.post.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments or comments on your posts',
      });
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Decrement post comments count
    await prisma.post.update({
      where: { id: comment.postId },
      data: {
        commentsCount: { decrement: 1 },
      },
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
    });
  }
};

export default {
  addComment,
  getComments,
  deleteComment,
};
