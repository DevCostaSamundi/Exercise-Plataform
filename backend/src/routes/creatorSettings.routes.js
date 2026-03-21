import express from 'express';
import { authenticate, requireCreator } from '../middleware/auth.middleware.js';
import {
  getCreatorSettings,
  updateCreatorSettings,
} from '../controllers/creatorSettings.controller.js';
import { uploadImage } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireCreator);

// GET /api/v1/creator/settings
router.get('/', getCreatorSettings);

// PUT /api/v1/creator/settings
// uploadImage: apenas imagens até 5MB — adequado para avatar e cover
router.put(
  '/',
  uploadImage.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover',  maxCount: 1 },
  ]),
  updateCreatorSettings
);

export default router;