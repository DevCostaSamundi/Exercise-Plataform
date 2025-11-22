import multer from 'multer';
import path from 'path';
import { BadRequestError } from '../utils/errors.js';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,video/mp4').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
});

/**
 * Middleware for single file upload
 */
export const uploadSingle = (fieldName) => upload.single(fieldName);

/**
 * Middleware for multiple files upload
 */
export const uploadMultiple = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);

/**
 * Middleware for multiple fields upload
 */
export const uploadFields = (fields) => upload.fields(fields);

export default upload;
