import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getWallet,
  getTransactions,
  exportTransactions,
} from '../controllers/transaction.controller.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/v1/wallet - Obter dados da carteira
router.get('/wallet', getWallet);

// GET /api/v1/transactions - Listar transações
router.get('/transactions', getTransactions);

// GET /api/v1/transactions/export - Exportar para CSV
router.get('/transactions/export', exportTransactions);

export default router;