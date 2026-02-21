/**
 * Portfolio Routes
 * User portfolio endpoints
 */

import express from 'express';
import tokenService from '../services/tokenService.js';
import { authenticate, authenticateByWallet } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require wallet authentication
router.use(authenticateByWallet);

/**
 * GET /api/portfolio
 * Get current user's portfolio
 */
router.get('/', async (req, res) => {
  try {
    const userAddress = req.user.web3Wallet;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'No wallet connected' });
    }
    
    const { page = 1, limit = 20 } = req.query;
    
    const result = await tokenService.getUserHoldings(userAddress, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

/**
 * GET /api/portfolio/trades
 * Get current user's trade history
 */
router.get('/trades', async (req, res) => {
  try {
    const userAddress = req.user.web3Wallet;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'No wallet connected' });
    }
    
    const { page = 1, limit = 50 } = req.query;
    
    const result = await tokenService.getUserTrades(userAddress, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

/**
 * GET /api/portfolio/created
 * Get tokens created by current user
 */
router.get('/created', async (req, res) => {
  try {
    const userAddress = req.user.web3Wallet;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'No wallet connected' });
    }
    
    const { page = 1, limit = 20 } = req.query;
    
    const result = await tokenService.getTokensByCreator(userAddress, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching created tokens:', error);
    res.status(500).json({ error: 'Failed to fetch created tokens' });
  }
});

/**
 * GET /api/portfolio/stats
 * Get user trading stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userAddress = req.user.web3Wallet;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'No wallet connected' });
    }
    
    // Get aggregated stats
    const [holdings, trades, created] = await Promise.all([
      tokenService.getUserHoldings(userAddress, { limit: 1000 }),
      tokenService.getUserTrades(userAddress, { limit: 1000 }),
      tokenService.getTokensByCreator(userAddress, { limit: 1000 })
    ]);
    
    // Calculate stats
    const stats = {
      totalHoldings: holdings.pagination.total,
      portfolioValue: holdings.totalValue,
      totalTrades: trades.pagination.total,
      tokensCreated: created.pagination.total,
      totalPnl: holdings.holdings.reduce((sum, h) => sum + h.pnl, 0),
      buyCount: trades.trades.filter(t => t.type === 'BUY').length,
      sellCount: trades.trades.filter(t => t.type === 'SELL').length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching portfolio stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
