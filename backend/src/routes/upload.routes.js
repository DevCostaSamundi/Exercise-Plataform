import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadMedia } from '../middleware/upload.middleware.js';
import cloudinaryService from '../services/cloudinary.service.js';
import ApiResponse from '../utils/response.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/v1/upload/media
 * Upload de mídia para Cloudinary
 * uploadMedia: imagens + vídeos, até 100MB, com fileFilter centralizado
 */
router.post('/media', authenticate, uploadMedia.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'Nenhum arquivo enviado', 400);
    }

    const { mediaType = 'photo' } = req.body;
    const userId = req.user.id;

    logger.info('📤 Upload request:', {
      userId,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      mediaType,
    });

    const folder = mediaType === 'video'
      ? `creators/${userId}/videos`
      : `creators/${userId}/photos`;

    const result = await cloudinaryService.uploadBufferToCloudinary(
      req.file.buffer,
      {
        folder,
        resource_type: mediaType === 'video' ? 'video' : 'image',
      }
    );

    logger.info('✅ Upload successful:', {
      url: result.secure_url,
      publicId: result.public_id,
    });

    const thumbnail = mediaType === 'video'
      ? cloudinaryService.getVideoThumbnail(result.public_id)
      : null;

    return ApiResponse.success(res, {
      url: result.secure_url,
      publicId: result.public_id,
      mediaType,
      thumbnail,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }, 'Upload realizado com sucesso');

  } catch (error) {
    logger.error('❌ Upload error:', error);
    next(error);
  }
});

/**
 * DELETE /api/v1/upload/media/:publicId
 * Deletar mídia do Cloudinary
 */
router.delete('/media/:publicId', authenticate, async (req, res, next) => {
  try {
    const decodedPublicId = decodeURIComponent(req.params.publicId);

    logger.info('🗑️  Delete request:', {
      userId: req.user.id,
      publicId: decodedPublicId,
    });

    await cloudinaryService.deleteFromCloudinary(decodedPublicId);

    return ApiResponse.success(res, null, 'Mídia deletada com sucesso');
  } catch (error) {
    logger.error('❌ Delete error:', error);
    next(error);
  }
});

export default router;