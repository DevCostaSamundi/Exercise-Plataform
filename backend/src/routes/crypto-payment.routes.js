/**
 * Crypto Payment Routes (Launchpad 2.0)
 * Simplified payment routes - actual payments happen via smart contracts
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/v1/crypto-payment/status
 * Check system status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Launchpad 2.0 - Payments are processed via smart contracts',
    network: 'Base Sepolia',
    chainId: 84532
  });
});

/**
 * GET /api/v1/crypto-payment/user-payments
 * Get user's payment history from blockchain
 */
router.get('/user-payments', authenticate, async (req, res) => {
  try {
    // TODO: Implement with blockchainSyncService
    res.json({
      success: true,
      data: [],
      message: 'Payment history from blockchain'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payment history' 
    });
  }
});

export default router;