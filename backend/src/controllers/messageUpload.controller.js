import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadMessageMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado',
      });
    }

    const userId = req.user.id;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de arquivo não suportado',
      });
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande (máximo 10MB)',
      });
    }

    // Upload para Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `messages/${userId}`,
          resource_type: 'auto',
          transformation: req.file.mimetype.startsWith('image/')
            ? [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto:good' },
              ]
            : undefined,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        type: req.file.mimetype. startsWith('image/') ? 'image' : 'video',
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    logger.error('Error uploading message media:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload',
    });
  }
};

export default {
  uploadMessageMedia,
};