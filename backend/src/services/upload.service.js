import cloudinary from '../config/cloudinary.js';
import fs from 'fs/promises';
import logger from '../utils/logger.js';

class UploadService {
  /**
   * Upload file to Cloudinary
   */
  async uploadFile(filePath, folder = 'prideconnect') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'auto',
      });

      // Delete local file after upload
      await fs.unlink(filePath);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error('Error uploading file to Cloudinary:', error);
      // Try to delete local file even if upload fails
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        logger.error('Error deleting local file:', unlinkError);
      }
      throw error;
    }
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadMultipleFiles(files, folder = 'prideconnect') {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file.path, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      logger.error('Error deleting file from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Delete multiple files from Cloudinary
   */
  async deleteMultipleFiles(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      logger.error('Error deleting multiple files:', error);
      throw error;
    }
  }

  /**
   * Upload image with transformations
   */
  async uploadImage(filePath, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: options.folder || 'prideconnect',
        transformation: options.transformation || [
          { width: 1000, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      });

      // Delete local file after upload
      await fs.unlink(filePath);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error('Error uploading image:', error);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        logger.error('Error deleting local file:', unlinkError);
      }
      throw error;
    }
  }

  /**
   * Upload video
   */
  async uploadVideo(filePath, folder = 'prideconnect/videos') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'video',
      });

      // Delete local file after upload
      await fs.unlink(filePath);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        duration: result.duration,
      };
    } catch (error) {
      logger.error('Error uploading video:', error);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        logger.error('Error deleting local file:', unlinkError);
      }
      throw error;
    }
  }
}

export default new UploadService();
