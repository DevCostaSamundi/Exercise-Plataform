import multer from 'multer';

/**
 * Upload Middleware — configuração centralizada
 * Substitui multer.js e upload.middleware.js anteriores
 */

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_DOC_TYPES   = ['application/pdf'];

// ── Filtros ────────────────────────────────────────────────────────────────

const imageOnlyFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF, WebP).'), false);
  }
};

const mediaFilter = (req, file, cb) => {
  const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo inválido. Permitido: imagens (JPEG, PNG, GIF, WebP) e vídeos (MP4, WebM, MOV).'), false);
  }
};

const imageAndDocFilter = (req, file, cb) => {
  const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo inválido. Permitido: imagens e PDF.'), false);
  }
};

// ── Instâncias exportadas ──────────────────────────────────────────────────

/**
 * uploadImage — apenas imagens, máx 5MB
 * Usar em: avatares, capas de perfil, fotos de produto
 */
export const uploadImage = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * uploadMedia — imagens e vídeos, máx 100MB
 * Usar em: posts, mensagens, conteúdo de criadores
 */
export const uploadMedia = multer({
  storage,
  fileFilter: mediaFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

/**
 * uploadDoc — imagens e PDFs, máx 5MB
 * Usar em: verificação de identidade (KYC), documentos
 */
export const uploadDoc = multer({
  storage,
  fileFilter: imageAndDocFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Export default para compatibilidade com código existente que importa upload
export const upload = uploadMedia;
export default uploadMedia;