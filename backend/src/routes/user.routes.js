import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import userController from '../controllers/user.controller.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/v1/user/profile - Obter perfil
router.get('/profile', userController.getProfile);

// PUT /api/v1/user/profile - Atualizar perfil
router.put('/profile', userController.updateProfile);

// PUT /api/v1/user/password - Alterar senha
router.put('/password', userController. changePassword);

// GET /api/v1/user/settings - Obter configurações
router. get('/settings', userController.getSettings);

// PUT /api/v1/user/settings - Atualizar configurações
router. put('/settings', userController.updateSettings);

// PUT /api/v1/user/email - Atualizar email
router.put('/email', userController.updateEmail);

// DELETE /api/v1/user/account - Deletar conta
router.delete('/account', userController.deleteAccount);

export default router;