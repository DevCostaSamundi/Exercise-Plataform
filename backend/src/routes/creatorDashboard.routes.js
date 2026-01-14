import express from 'express';
import { authenticate, requireCreator } from '../middleware/auth.middleware.js';
import { getDashboardStats } from '../controllers/creatorDashboard.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(requireCreator);

/**
 * @route   GET /api/v1/creator-dashboard/stats
 * @desc    Estatísticas do dashboard do criador
 * @access  Protegido
 */
router.get('/stats', getDashboardStats);

export default router;