import prisma from '../config/database.js';
import logger from '../utils/logger.js';

class TipService {
  /**
   * Criar registo de gorjeta
   * Em produção: processar pagamento USDC on-chain antes de criar o registo
   */
  async createTip(data) {
    const { fromUserId, toCreatorId, amount, messageId, meta } = data;

    logger.info(`[STUB] Processing tip: ${amount} USDC from ${fromUserId} to ${toCreatorId}`);

    const tip = await prisma.tip.create({
      data: {
        fromUserId,
        toCreatorId,
        messageId: messageId || null,
        amount,
        currency: 'USDC', // ⚠️  CORRIGIDO: era 'BRL' — plataforma opera em USDC/Polygon
        status:   'completed',
        meta:     meta || null,
      },
    });

    logger.info(`[STUB] Tip created: ${tip.id}`);
    return tip;
  }

  /**
   * Obter gorjetas de um criador
   */
  async getCreatorTips(creatorId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    return prisma.tip.findMany({
      where:   { toCreatorId: creatorId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  /**
   * Verificar se utilizador já enviou gorjeta a um criador
   */
  async hasUserTippedCreator(userId, creatorId) {
    const tip = await prisma.tip.findFirst({
      where: { fromUserId: userId, toCreatorId: creatorId },
    });
    return !!tip;
  }
}

export default new TipService();