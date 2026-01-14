// backend/src/routes/creatorSubscribers.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  getSubscribers, 
  getSubscriberDetails 
} from '../controllers/creatorSubscribers.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @route   GET /api/v1/creator/subscribers
 * @desc    Get all subscribers for the creator
 * @access  Private (Creator only)
 */
router.get('/', getSubscribers);

/**
 * @route   GET /api/v1/creator/subscribers/:id
 * @desc    Get subscriber details
 * @access  Private (Creator only)
 */
router.get('/:id', getSubscriberDetails);

export default router;