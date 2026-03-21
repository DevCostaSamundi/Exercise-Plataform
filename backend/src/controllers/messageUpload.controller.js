import cloudinary from '../config/cloudinary.js';
import logger from '../utils/logger.js';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const uploadMessageMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado',
      });
    }

    const userId = req.user.id;

    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de arquivo não suportado',
      });
    }

    if (req.file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande (máximo 10MB)',
      });
    }

    const isImage = req.file.mimetype.startsWith('image/');

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `messages/${userId}`,
          resource_type: 'auto',
          transformation: isImage
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
        type: isImage ? 'image' : 'video',
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

export default { uploadMessageMedia };