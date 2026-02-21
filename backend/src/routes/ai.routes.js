/**
 * AI Marketing Routes
 * Admin-only routes for AI strategic intelligence
 */

import express from 'express';
import aiMarketingService from '../services/aiMarketingService.js';
import { isAdminByWallet } from '../middleware/admin.js';

const router = express.Router();

// All routes require admin (owner wallet) verification
// Uses X-Wallet-Address header for verification
router.use(isAdminByWallet);

/**
 * GET /api/ai/marketing-strategy
 * Get current marketing strategy suggestion
 */
router.get('/marketing-strategy', async (req, res) => {
  try {
    const strategy = await aiMarketingService.generateMarketingStrategy();
    res.json(strategy);
  } catch (error) {
    console.error('Error generating marketing strategy:', error);
    res.status(500).json({ error: 'Failed to generate strategy' });
  }
});

/**
 * GET /api/ai/token-launch-advice
 * Get suggestions for tokens to launch
 */
router.get('/token-launch-advice', async (req, res) => {
  try {
    const advice = await aiMarketingService.getTokenLaunchAdvice();
    res.json(advice);
  } catch (error) {
    console.error('Error getting token launch advice:', error);
    res.status(500).json({ error: 'Failed to get advice' });
  }
});

/**
 * GET /api/ai/buyer-strategies
 * Get strategies to attract buyers
 */
router.get('/buyer-strategies', async (req, res) => {
  try {
    const strategies = await aiMarketingService.getBuyerAttractionStrategies();
    res.json(strategies);
  } catch (error) {
    console.error('Error getting buyer strategies:', error);
    res.status(500).json({ error: 'Failed to get strategies' });
  }
});

/**
 * GET /api/ai/viral-content
 * Detect viral crypto content and get adaptations
 */
router.get('/viral-content', async (req, res) => {
  try {
    const content = await aiMarketingService.detectViralContent();
    res.json(content);
  } catch (error) {
    console.error('Error detecting viral content:', error);
    res.status(500).json({ error: 'Failed to detect content' });
  }
});

/**
 * GET /api/ai/optimal-timing
 * Get best times to post
 */
router.get('/optimal-timing', async (req, res) => {
  try {
    const timing = await aiMarketingService.getOptimalPostingTimes();
    res.json(timing);
  } catch (error) {
    console.error('Error getting optimal timing:', error);
    res.status(500).json({ error: 'Failed to get timing' });
  }
});

/**
 * GET /api/ai/competitors
 * Get competitor analysis
 */
router.get('/competitors', async (req, res) => {
  try {
    const insights = await aiMarketingService.getCompetitorInsights();
    res.json(insights);
  } catch (error) {
    console.error('Error getting competitor insights:', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

/**
 * GET /api/ai/growth-playbook
 * Get growth hacking tactics
 */
router.get('/growth-playbook', async (req, res) => {
  try {
    const playbook = await aiMarketingService.getGrowthPlaybook();
    res.json(playbook);
  } catch (error) {
    console.error('Error getting growth playbook:', error);
    res.status(500).json({ error: 'Failed to get playbook' });
  }
});

/**
 * GET /api/ai/token-graveyard
 * Analyze failed tokens
 */
router.get('/token-graveyard', async (req, res) => {
  try {
    const analysis = await aiMarketingService.analyzeTokenGraveyard();
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing token graveyard:', error);
    res.status(500).json({ error: 'Failed to analyze' });
  }
});

/**
 * GET /api/ai/sentiment
 * Get sentiment analysis of platform mentions
 */
router.get('/sentiment', async (req, res) => {
  try {
    const sentiment = await aiMarketingService.analyzeSentiment();
    res.json(sentiment);
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

/**
 * GET /api/ai/dashboard
 * Get all AI insights in one call (for dashboard overview)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      marketingStrategy,
      sentiment,
      timing,
      competitors
    ] = await Promise.all([
      aiMarketingService.generateMarketingStrategy(),
      aiMarketingService.analyzeSentiment(),
      aiMarketingService.getOptimalPostingTimes(),
      aiMarketingService.getCompetitorInsights()
    ]);

    res.json({
      marketingStrategy,
      sentiment,
      timing,
      competitors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting AI dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

export default router;
