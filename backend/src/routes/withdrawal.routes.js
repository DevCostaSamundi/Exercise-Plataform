import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  requestWithdrawal,
  processWithdrawal,
  getCreatorWithdrawals,
  getCreatorBalance,
  cancelWithdrawal,
} from '../controllers/withdrawal.controller.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/v1/withdrawals/balance - Obter saldo do criador
router.get('/balance', getCreatorBalance);

// GET /api/v1/withdrawals - Listar saques
router.get('/', getCreatorWithdrawals);

// POST /api/v1/withdrawals - Solicitar saque
router.post('/', requestWithdrawal);

// POST /api/v1/withdrawals/:withdrawalId/process - Processar saque (ADMIN)
router.post('/:withdrawalId/process', processWithdrawal);

// DELETE /api/v1/withdrawals/:withdrawalId - Cancelar saque
router.delete('/:withdrawalId', cancelWithdrawal);

export default router;