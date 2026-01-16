import cron from 'node-cron';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import paymentService from '../services/payment/index.js';

/**
 * Expirar pagamentos pendentes após 15 minutos
 * Roda a cada 1 minuto
 */
export const expireOldPayments = cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    const expiredPayments = await prisma. payment.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now,
        },
      },
    });

    if (expiredPayments.length > 0) {
      await prisma.payment.updateMany({
        where: {
          id:  {
            in: expiredPayments.map(p => p.id),
          },
        },
        data:  {
          status: 'EXPIRED',
        },
      });

      logger.info(`⏰ Expired ${expiredPayments.length} payments`);
    }
  } catch (error) {
    logger.error('❌ Error expiring old payments:', error);
  }
});

/**
 * Verificar status de pagamentos pendentes
 * Roda a cada 5 minutos
 */
export const checkPendingPayments = cron. schedule('*/5 * * * *', async () => {
  try {
    const pendingPayments = await prisma.payment. findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMING'],
        },
        gateway: {
          in: ['NOWPAYMENTS', 'BTCPAY'],
        },
        expiresAt: {
          gt: new Date(),
        },
      },
      take: 50,
    });

    if (pendingPayments.length > 0) {
      logger.info(`🔄 Checking ${pendingPayments.length} pending payments`);

      for (const payment of pendingPayments) {
        try {
          await paymentService.checkPaymentStatus(payment. id);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`❌ Error checking payment ${payment.id}: `, error);
        }
      }
    }
  } catch (error) {
    logger.error('❌ Error checking pending payments:', error);
  }
});

/**
 * Renovar assinaturas automáticas
 * Roda diariamente às 00:00
 */
export const renewSubscriptions = cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        autoRenew: true,
        endDate: {
          gte: now,
          lt: tomorrow,
        },
      },
      include: {
        user: true,
        creator: true,
      },
    });

    if (expiringSubscriptions.length > 0) {
      logger.info(`🔄 Found ${expiringSubscriptions.length} subscriptions to renew`);

      for (const subscription of expiringSubscriptions) {
        try {
          const wallet = await prisma.userWallet.findUnique({
            where: { userId: subscription.userId },
          });

          if (wallet && wallet.balanceUSD >= subscription.amount) {
            await prisma. userWallet.update({
              where: { userId: subscription.userId },
              data: {
                balanceUSD: { decrement: subscription.amount },
                totalSpent: { increment: subscription. amount },
              },
            });

            const newEndDate = new Date(subscription.endDate);
            newEndDate. setMonth(newEndDate.getMonth() + 1);

            await prisma.subscription.update({
              where: { id:  subscription.id },
              data: { endDate: newEndDate },
            });

            logger.info(`✅ Subscription renewed:  ${subscription.id}`);
          } else {
            logger.info(`⚠️ Insufficient balance for subscription ${subscription.id}`);
          }
        } catch (error) {
          logger.error(`❌ Error renewing subscription ${subscription. id}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error('❌ Error renewing subscriptions:', error);
  }
});

/**
 * Notificar usuários sobre assinaturas expirando
 * Roda diariamente às 10:00
 */
export const notifyExpiringSubscriptions = cron. schedule('0 10 * * *', async () => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte:  now,
          lt: threeDaysFromNow,
        },
      },
      include: {
        user: true,
        creator: {
          include: {
            user: true,
          },
        },
      },
    });

    if (expiringSubscriptions.length > 0) {
      logger.info(`📧 Notifying ${expiringSubscriptions.length} users about expiring subscriptions`);
      // TODO: Implementar envio de emails/notificações
    }
  } catch (error) {
    logger.error('❌ Error notifying expiring subscriptions:', error);
  }
});

// Iniciar todos os cron jobs
export const startPaymentJobs = () => {
  logger.info('🕐 Starting payment cron jobs...');
  
  expireOldPayments. start();
  checkPendingPayments.start();
  renewSubscriptions.start();
  notifyExpiringSubscriptions.start();
  
  logger.info('✅ Payment cron jobs started');
};

// Parar todos os cron jobs
export const stopPaymentJobs = () => {
  logger.info('⏸️ Stopping payment cron jobs...');
  
  expireOldPayments.stop();
  checkPendingPayments. stop();
  renewSubscriptions. stop();
  notifyExpiringSubscriptions.stop();
  
  logger.info('✅ Payment cron jobs stopped');
};