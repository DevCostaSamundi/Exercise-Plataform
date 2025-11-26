import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * TipService - Stub implementation for tip/payment processing
 * In production, integrate with real payment gateway
 */
class TipService {
  /**
   * Create a tip record (stubbed - no real payment processing)
   * @param {Object} data - Tip data
   * @returns {Promise<Object>} Created tip
   */
  async createTip(data) {
    const { fromUserId, toCreatorId, amount, messageId, meta } = data;

    // In production, this would:
    // 1. Process payment via payment gateway
    // 2. Create tip record only after payment succeeds
    // 3. Handle payment failures and retries

    logger.info(`[STUB] Processing tip: ${amount} from ${fromUserId} to ${toCreatorId}`);

    const tip = await prisma.tip.create({
      data: {
        fromUserId,
        toCreatorId,
        messageId: messageId || null,
        amount,
        currency: 'BRL',
        status: 'completed', // stub: always success
        meta: meta || null,
      },
    });

    logger.info(`[STUB] Tip created: ${tip.id}`);
    return tip;
  }

  /**
   * Get tips for a creator
   */
  async getCreatorTips(creatorId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const tips = await prisma.tip.findMany({
      where: { toCreatorId: creatorId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return tips;
  }

  /**
   * Check if user has ever tipped a creator
   */
  async hasUserTippedCreator(userId, creatorId) {
    const tip = await prisma.tip.findFirst({
      where: {
        fromUserId: userId,
        toCreatorId: creatorId,
      },
    });

    return !!tip;
  }
}

export default new TipService();
