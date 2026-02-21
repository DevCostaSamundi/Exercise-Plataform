import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getWallet,
  getTransactions,
  exportTransactions,
} from '../controllers/transaction.controller.js';

const router = express.Router();

// GET /api/v1/wallet - Obter dados da carteira (requer autenticação)
router.get('/wallet', authenticate, getWallet);

// GET /api/v1/transactions - Listar transações (requer autenticação)
router.get('/transactions', authenticate, getTransactions);

// GET /api/v1/transactions/export - Exportar para CSV (requer autenticação)
router.get('/transactions/export', authenticate, exportTransactions);

export default router;