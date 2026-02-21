/**
 * Upload Middleware
 * Handles file uploads using multer with local storage
 */

import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { UPLOAD_LIMITS } from '../config/constants.js';

// Storage configuration - save to uploads/ directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter - only allow images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF, WebP, and SVG are allowed.`), false);
  }
};

// Upload instance for single image
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: (UPLOAD_LIMITS?.MAX_IMAGE_SIZE || 5) * 1024 * 1024, // 5MB default
  }
});

export default uploadImage;
