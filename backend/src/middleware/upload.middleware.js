import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Pasta de destino (crie se não existir)
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Storage em disco - em produção substitua por Cloudinary/S3
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

function fileFilter (req, file, cb) {
  // Permitir imagens e pdfs para documentos
  const allowed = /jpeg|jpg|png|gif|pdf/;
  const ext = file.mimetype || '';
  if (/image\/|application\/pdf/.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});