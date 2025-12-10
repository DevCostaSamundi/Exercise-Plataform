import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getWallet,
  getTransactions,
  exportTransactions,
} from '../controllers/transaction.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/wallet
 * @desc    Get user wallet balance
 * @access  Private
 */
router.get('/wallet', getWallet);

/**
 * @route   GET /api/v1/transactions
 * @desc    Get user transaction history
 * @access  Private
 */
router.get('/transactions', getTransactions);

/**
 * @route   GET /api/v1/transactions/export
 * @desc    Export transactions to CSV
 * @access  Private
 */
router.get('/transactions/export', exportTransactions);

export default router;
