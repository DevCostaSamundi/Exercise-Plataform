import multer from 'multer';
import path from 'path';

// Use memory storage for production-ready uploads to Cloudinary/S3
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  // Validate by mimetype
  const validMimetypes = /^image\/(jpeg|jpg|png|gif)$|^application\/pdf$/;
  const mimetypeValid = validMimetypes.test(file.mimetype);

  // Validate by extension as additional check
  const ext = path.extname(file.originalname).toLowerCase();
  const validExtensions = /^\.(jpeg|jpg|png|gif|pdf)$/;
  const extValid = validExtensions.test(ext);

  if (mimetypeValid && extValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (jpeg, jpg, png, gif) and PDF files are allowed.'), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});