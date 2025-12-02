import logger from '../utils/logger.js';
import prisma from '../config/database.js';

class NotificationService {
  /**
   * Notificar novo assinante
   */
  async notifyNewSubscriber(subscription) {
    try {
      const sub = await prisma.subscription.findUnique({
        where: { id: subscription.id },
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
              email: true,
            },
          },
          creator: {
            include: {
              user: {
                select: {
                  username: true,
                  displayName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Email para o usuário
      logger.info(`📧 [DEV] Email para ${sub.user.email}:`);
      logger.info(`   Assunto: Bem-vindo à ${sub.creator.user.displayName}!`);
      logger.info(`   Você agora tem acesso a todo conteúdo exclusivo!`);

      // Email para o criador
      logger. info(`📧 [DEV] Email para ${sub.creator.user.email}:`);
      logger.info(`   Assunto: Novo assinante! `);
      logger.info(`   @${sub.user.username} acabou de assinar seu conteúdo! `);

      // TODO: Integrar com serviço de email real (SendGrid, Mailgun, etc)
      
    } catch (error) {
      logger.error('Error sending notifications:', error);
    }
  }

  /**
   * Notificar pagamento recebido
   */
  async notifyPaymentReceived(payment) {
    try {
      const paymentData = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: {
          user: {
            select: { email: true, displayName: true },
          },
          creator: {
            include: {
              user: {
                select: { email: true, displayName: true },
              },
            },
          },
        },
      });

      logger.info(`💰 [DEV] Pagamento confirmado! `);
      logger.info(`   De: ${paymentData.user.displayName}`);
      logger.info(`   Para: ${paymentData.creator?.user.displayName || 'Plataforma'}`);
      logger.info(`   Valor: $${paymentData.amountUSD}`);
      logger.info(`   Cripto: ${paymentData.cryptoCurrency}`);
      logger.info(`   TX: ${paymentData.txHash}`);

    } catch (error) {
      logger.error('Error notifying payment:', error);
    }
  }
}

export default new NotificationService();