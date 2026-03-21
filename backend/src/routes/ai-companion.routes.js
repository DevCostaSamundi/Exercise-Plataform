// ============================================================
// AI COMPANION ROUTES
// ============================================================

import { Router } from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
    createCompanion,
    listCompanions,
    getCompanion,
    updateCompanion,
    deleteCompanion,
    myCompanions,
} from '../controllers/ai-companion.controller.js';

const router = Router();

// Público — catálogo
router.get('/companions', listCompanions);
router.get('/companions/:idOrSlug', getCompanion);

// Autenticado — criador
router.post('/companions', auth, createCompanion);
router.get('/companions/my/list', auth, myCompanions);
router.patch('/companions/:id', auth, updateCompanion);
router.delete('/companions/:id', auth, deleteCompanion);

export default router;
