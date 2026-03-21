import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import logger from '../utils/logger.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Log seguro — sem expor valores reais
logger.info('☁️ Cloudinary config loaded', {
  cloud_name: cloudinary.config().cloud_name || 'MISSING',
  api_key:    cloudinary.config().api_key    ? 'OK' : 'MISSING',
  api_secret: cloudinary.config().api_secret ? 'OK' : 'MISSING',
});

/**
 * Upload de buffer para Cloudinary
 */
export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Thumbnail de vídeo
 */
export function getVideoThumbnail(publicId) {
  return cloudinary.url(publicId, {
    resource_type:  'video',
    format:         'jpg',
    transformation: [{ width: 400, crop: 'scale' }],
  });
}

/**
 * Deletar mídia
 */
export async function deleteFromCloudinary(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
}

export default {
  uploadBufferToCloudinary,
  getVideoThumbnail,
  deleteFromCloudinary,
};