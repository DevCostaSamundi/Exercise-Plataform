import logger from '../utils/logger.js';
import prisma from '../config/database.js';
import { notifyUser } from '../config/socket.js';

class NotificationService {
  /**
   * Criar uma notificação genérica
   */
  async createNotification(data) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId:    data.userId,
          type:      data.type,
          title:     data.title,
          message:   data.message,
          metadata:  data.metadata || {},
          actionUrl: data.actionUrl,
        },
      });

      // Emitir via WebSocket em tempo real
      notifyUser(data.userId, 'notification:new', notification);

      logger.info(`✅ Notification created: ${data.type} for user ${data.userId}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Notificar novo assinante
   */
  async notifyNewSubscriber(subscription) {
    try {
      const sub = await prisma.subscription.findUnique({
        where: { id: subscription.id },
        include: {
          user:    { select: { username: true, displayName: true } },
          creator: { include: { user: true } },
        },
      });

      await this.createNotification({
        userId:   sub.creator.userId,
        type:     'SUBSCRIBER',
        title:    'Novo assinante!',
        message:  `${sub.user.displayName || sub.user.username} acabou de assinar o teu plano.`,
        metadata: { subscriptionId: sub.id, subscriberId: sub.userId },
        actionUrl: '/creator/subscribers',
      });
    } catch (error) {
      logger.error('Error notifying new subscriber:', error);
    }
  }

  /**
   * Notificar novo comentário
   */
  async notifyNewComment(comment, post) {
    try {
      await this.createNotification({
        userId:   post.creatorId,
        type:     'COMMENT',
        title:    'Novo comentário',
        message:  `${comment.user.displayName} comentou no teu post "${post.title}".`,
        metadata: { commentId: comment.id, postId: post.id },
        actionUrl: `/creator/posts?highlight=${post.id}`,
      });
    } catch (error) {
      logger.error('Error notifying new comment:', error);
    }
  }

  /**
   * Notificar gorjeta recebida
   */
  async notifyTipReceived(tip) {
    try {
      await this.createNotification({
        userId:   tip.creatorId,
        type:     'TIP',
        title:    'Gorjeta recebida!',
        message:  `Recebeste $${tip.amount} de gorjeta!`,
        metadata: { tipId: tip.id, amount: tip.amount },
        actionUrl: '/creator/earnings',
      });
    } catch (error) {
      logger.error('Error notifying tip:', error);
    }
  }

  /**
   * Notificar milestone atingido
   */
  async notifyMilestone(userId, milestone) {
    try {
      await this.createNotification({
        userId,
        type:     'MILESTONE',
        title:    'Marco atingido! 🎉',
        message:  milestone.message,
        metadata: milestone.data,
        actionUrl: '/creator/dashboard',
      });
    } catch (error) {
      logger.error('Error notifying milestone:', error);
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
          creator: { include: { user: true } },
        },
      });

      await this.createNotification({
        userId:   paymentData.creator.userId,
        type:     'PAYMENT',
        title:    'Pagamento aprovado',
        message:  `Transferência de $${paymentData.amountUSD} foi aprovada.`,
        metadata: { paymentId: payment.id, amount: paymentData.amountUSD },
        actionUrl: '/creator/earnings',
      });
    } catch (error) {
      logger.error('Error notifying payment:', error);
    }
  }
}

export default new NotificationService();