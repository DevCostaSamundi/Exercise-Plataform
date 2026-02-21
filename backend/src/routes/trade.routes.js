/**
 * Trade Routes
 * API endpoints for trade data
 */

import express from 'express';
import tokenService from '../services/tokenService.js';

const router = express.Router();

/**
 * GET /api/trades
 * Get recent trades across all tokens or for a specific token
 */
router.get('/', async (req, res) => {
  try {
    const { tokenAddress, limit = 10 } = req.query;
    
    const result = await tokenService.getRecentTrades({
      tokenAddress,
      limit: parseInt(limit)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching recent trades:', error);
    res.status(500).json({ error: 'Failed to fetch recent trades' });
  }
});

export default router;
