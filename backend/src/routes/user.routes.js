import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import userController from '../controllers/user.controller.js';

const router = express.Router();

router.use(authenticate);

// GET  /api/v1/user/profile
router.get   ('/profile',  userController.getProfile);

// PUT  /api/v1/user/profile
router.put   ('/profile',  userController.updateProfile);

// PUT  /api/v1/user/password
router.put   ('/password', userController.changePassword);

// GET  /api/v1/user/settings
router.get   ('/settings', userController.getSettings);

// PUT  /api/v1/user/settings
router.put   ('/settings', userController.updateSettings);

// PUT  /api/v1/user/email
router.put   ('/email',    userController.updateEmail);

// DELETE /api/v1/user/account
router.delete('/account',  userController.deleteAccount);

export default router;