// backend/src/routes/upload.routes.js
import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import cloudinaryService from '../services/cloudinary.service.js';
import ApiResponse from '../utils/response.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Configurar multer para memória (não salva em disco)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
});

/**
 * @route   POST /api/v1/upload/media
 * @desc    Upload de mídia para Cloudinary
 * @access  Protegido
 */
router.post('/media', authenticate, upload.single('file'), async (req, res, next) => {
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

    // Determinar pasta no Cloudinary
    const folder = mediaType === 'video' 
      ? `creators/${userId}/videos` 
      : `creators/${userId}/photos`;

    // Upload para Cloudinary
    const uploadOptions = {
      folder,
      resource_type: mediaType === 'video' ? 'video' : 'image',
    };

    const result = await cloudinaryService.uploadBufferToCloudinary(
      req.file.buffer,
      uploadOptions
    );

    logger.info('✅ Upload successful:', {
      url: result.secure_url,
      publicId: result.public_id,
    });

    // Gerar thumbnail para vídeos
    let thumbnail = null;
    if (mediaType === 'video') {
      thumbnail = cloudinaryService.getVideoThumbnail(result.public_id);
    }

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
 * @route   DELETE /api/v1/upload/media/:publicId
 * @desc    Deletar mídia do Cloudinary
 * @access  Protegido
 */
router.delete('/media/:publicId', authenticate, async (req, res, next) => {
  try {
    const { publicId } = req.params;
    
    // Decodificar publicId (vem encoded da URL)
    const decodedPublicId = decodeURIComponent(publicId);

    logger.info('🗑️  Delete request:', {
      userId: req.user.id,
      publicId: decodedPublicId,
    });

    await cloudinaryService.deleteFromCloudinary(decodedPublicId);

    logger.info('✅ Delete successful');

    return ApiResponse.success(res, null, 'Mídia deletada com sucesso');

  } catch (error) {
    logger.error('❌ Delete error:', error);
    next(error);
  }
});

export default router;