import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export const getMyPosts = async (req, res) => {
  try {
    const creatorId = req.user.creatorId;
    const { status = 'all', limit = 50, page = 1 } = req.query;

    if (!creatorId) {
      return res.status(403).json({
        success: false,
        message: 'Apenas criadores podem acessar esta rota',
      });
    }

    const posts = await prisma.post.findMany({
      where: { creatorId },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        mediaUrls: true,
        mediaType: true,
        isPublic: true,
        isPPV: true,
        ppvPrice: true,
        likesCount: true,
        commentsCount: true,
        viewsCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title || 'Sem título',
      description: post.content || '',
      thumbnail: Array. isArray(post.mediaUrls) ? post.mediaUrls[0] : null,
      type: post.mediaType. toLowerCase() === 'image' ? 'photo' : post.mediaType.toLowerCase(),
      mediaCount: Array.isArray(post.mediaUrls) ? post.mediaUrls.length : 0,
      visibility: post.isPPV ? 'premium' : (post.isPublic ? 'free' : 'subscribers'),
      status: 'published',
      likes: post.likesCount,
      comments: post.commentsCount,
      views: post.viewsCount,
      earnings: post.isPPV ? parseFloat(post.ppvPrice || 0) : 0,
      publishedAt: post.createdAt,
      tags: [],
    }));

    const stats = {
      all: posts.length,
      published: posts.length,
      scheduled: 0,
      draft: 0,
    };

    res.json({
      success: true,
      data: formattedPosts,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: posts.length,
      },
    });
  } catch (error) {
    logger. error('Get my posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export const createPost = async (req, res) => {
  try {
    const creatorId = req.user.creatorId;
    const { title, content, mediaUrls, mediaType, isPublic, isPPV, ppvPrice } = req.body;

    const post = await prisma.post. create({
      data: {
        creatorId,
        title,
        content,
        mediaUrls,
        mediaType: mediaType || 'IMAGE',
        isPublic: isPublic !== undefined ? isPublic : true,
        isPPV: isPPV || false,
        ppvPrice: ppvPrice ?  parseFloat(ppvPrice) : null,
      },
    });

    res.status(201). json({
      success: true,
      data: post,
      message: 'Post criado com sucesso',
    });
  } catch (error) {
    logger.error('Create post error:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar post' });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.creatorId;

    const existingPost = await prisma.post.findFirst({
      where: { id, creatorId },
    });

    if (!existingPost) {
      return res.status(404).json({ success: false, message: 'Post não encontrado' });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: req.body,
    });

    res.json({ success: true, data: updatedPost, message: 'Post atualizado' });
  } catch (error) {
    logger.error('Update post error:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar post' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req. params;
    const creatorId = req.user.creatorId;

    const post = await prisma.post.findFirst({
      where: { id, creatorId },
    });

    if (!post) {
      return res.status(404). json({ success: false, message: 'Post não encontrado' });
    }

    await prisma.post.delete({ where: { id } });
    res.json({ success: true, message: 'Post deletado' });
  } catch (error) {
    logger.error('Delete post error:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar' });
  }
};

export const bulkDeletePosts = async (req, res) => {
  try {
    const { postIds } = req.body;
    const creatorId = req. user.creatorId;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ success: false, message: 'IDs inválidos' });
    }

    const result = await prisma.post.deleteMany({
      where: { id: { in: postIds }, creatorId },
    });

    res.json({ success: true, message: `${result.count} posts deletados`, count: result.count });
  } catch (error) {
    logger.error('Bulk delete error:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar' });
  }
};