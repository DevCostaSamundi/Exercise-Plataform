/**
 * Token Routes
 * API endpoints for token data
 */

import express from 'express';
import tokenService from '../services/tokenService.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/tokens
 * Get all tokens with pagination
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy, sortOrder, search, creator, graduated } = req.query;
    
    const result = await tokenService.getTokens({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      filter: {
        search,
        creator,
        graduated: graduated === 'true' ? true : graduated === 'false' ? false : undefined
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

/**
 * GET /api/tokens/trending
 * Get trending tokens by 24h volume
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const tokens = await tokenService.getTrendingTokens(parseInt(limit));
    res.json({ tokens });
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    res.status(500).json({ error: 'Failed to fetch trending tokens' });
  }
});

/**
 * GET /api/tokens/recent
 * Get recently created tokens
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const tokens = await tokenService.getRecentTokens(parseInt(limit));
    res.json({ tokens });
  } catch (error) {
    console.error('Error fetching recent tokens:', error);
    res.status(500).json({ error: 'Failed to fetch recent tokens' });
  }
});

/**
 * GET /api/tokens/stats
 * Get platform-wide statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await tokenService.getPlatformStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/tokens/:address
 * Get token details by address
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const token = await tokenService.getTokenByAddress(address);
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    res.json(token);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

/**
 * GET /api/tokens/:address/trades
 * Get trades for a token
 */
router.get('/:address/trades', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await tokenService.getTokenTrades(address, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching token trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

/**
 * GET /api/tokens/:address/holders
 * Get holders for a token
 */
router.get('/:address/holders', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await tokenService.getTokenHolders(address, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching token holders:', error);
    res.status(500).json({ error: 'Failed to fetch holders' });
  }
});

/**
 * GET /api/tokens/:address/chart
 * Get price history for charts
 */
router.get('/:address/chart', async (req, res) => {
  try {
    const { address } = req.params;
    const { timeframe = '24h' } = req.query;
    
    const candles = await tokenService.getPriceHistory(address, timeframe);
    res.json({ candles });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

/**
 * PUT /api/tokens/:address/metadata
 * Update token metadata (creator only)
 */
router.put('/:address/metadata', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const { description, logo, website, twitter, telegram, discord } = req.body;
    
    // Verify user is creator
    const token = await tokenService.getTokenByAddress(address);
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    if (token.creatorAddress.toLowerCase() !== req.user.web3Wallet?.toLowerCase()) {
      return res.status(403).json({ error: 'Only creator can update metadata' });
    }
    
    const updated = await tokenService.saveTokenMetadata(address, {
      description,
      logo,
      website,
      twitter,
      telegram,
      discord
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating token metadata:', error);
    res.status(500).json({ error: 'Failed to update metadata' });
  }
});

/**
 * GET /api/tokens/creator/:address
 * Get tokens created by a user
 */
router.get('/creator/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const result = await tokenService.getTokensByCreator(address, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching creator tokens:', error);
    res.status(500).json({ error: 'Failed to fetch creator tokens' });
  }
});

export default router;
