import multer from 'multer';

// Use memory storage for production-ready uploads to Cloudinary/S3
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  // Allow images and PDFs for KYC documents
  if (/^image\//.test(file.mimetype) || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDF files are allowed.'), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});