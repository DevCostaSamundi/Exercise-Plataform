import express from 'express';
import authController from '../controllers/auth.controller.js';
import validate from '../middleware/validation.middleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validator.js';
import { uploadDoc } from '../middleware/upload.middleware.js';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/v1/auth/creator-register
// uploadDoc: imagens + PDF até 5MB — adequado para documentos de identidade (KYC)
router.post(
  '/creator-register',
  uploadDoc.fields([
    { name: 'idDocument',   maxCount: 1 },
    { name: 'selfieWithId', maxCount: 1 },
  ]),
  authController.creatorRegister
);

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

// POST /api/v1/auth/logout
router.post('/logout', authController.logout);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;