import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test cloudinary connection
const testConnection = async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    logger.warn('⚠️  Cloudinary credentials not configured');
    return;
  }

  try {
    await cloudinary.api.ping();
    logger.info('✅ Cloudinary connected successfully');
  } catch (error) {
    logger.error('❌ Cloudinary connection failed:', error.message);
  }
};

testConnection();

export default cloudinary;
