import cron from 'node-cron';
import prisma from '../config/database.js';
import web3Service from '../services/web3.service.js';
import logger from '../utils/logger.js';
import { notifyUser } from '../config/socket.js';

/**
 * Blockchain Monitor Job
 * Monitoriza pagamentos pendentes e confirma-os quando a blockchain confirma
 * Corre a cada 30 segundos
 */

let isRunning = false;

async function monitorPendingPayments() {
  if (isRunning) {
    logger.debug('Blockchain monitor already running, skipping...');
    return;
  }

  isRunning = true;

  try {
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: { in: ['WAITING', 'CONFIRMING'] },
        web3TxHash: { not: null },
      },
      include: {
        creator: {
          select: {
            id: true,
            userId: true,         // ← userId do criador para notificações
            payoutWallet: true,
            displayName: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
      take: 50,
    });

    if (pendingPayments.length === 0) {
      logger.debug('No pending payments to monitor');
      return;
    }

    logger.info(`Monitoring ${pendingPayments.length} pending payments`);

    for (const payment of pendingPayments) {
      try {
        await verifyAndConfirmPayment(payment);
      } catch (error) {
        logger.error(`Error processing payment ${payment.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in blockchain monitor:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Verificar e confirmar um pagamento individual
 */
async function verifyAndConfirmPayment(payment) {
  const { id, web3TxHash, amountUSD, creator, user, type, subscriptionId } = payment;

  logger.info(`Verifying payment ${id}, tx: ${web3TxHash}`);

  try {
    const receipt = await web3Service.getTransactionReceipt(web3TxHash);

    if (!receipt) {
      logger.warn(`Transaction ${web3TxHash} not found yet`);
      return;
    }

    if (receipt.status === 0) {
      logger.error(`Transaction ${web3TxHash} failed on-chain`);

      await prisma.payment.update({
        where: { id },
        data: { status: 'FAILED' },
      });

      // Notificar utilizador do falhanço
      notifyUser(user.id, 'payment:failed', {
        paymentId: id,
        message: 'O teu pagamento falhou na blockchain.',
      });

      return;
    }

    const currentBlock = await web3Service.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;

    logger.info(`Payment ${id} has ${confirmations} confirmations`);

    await prisma.payment.update({
      where: { id },
      data: {
        web3Confirmations: confirmations,
        web3BlockNumber: receipt.blockNumber,
      },
    });

    const requiredConfirmations = parseInt(process.env.CONFIRMATIONS_REQUIRED || '2');

    if (confirmations < requiredConfirmations) {
      if (payment.status !== 'CONFIRMING') {
        await prisma.payment.update({
          where: { id },
          data: { status: 'CONFIRMING' },
        });
      }
      return;
    }

    const verification = await web3Service.verifyPayment(
      web3TxHash,
      parseFloat(amountUSD),
      creator.payoutWallet
    );

    if (!verification.valid) {
      logger.error(`Payment verification failed for ${id}:`, verification.error);

      await prisma.payment.update({
        where: { id },
        data: {
          status: 'FAILED',
          metadata: { verificationError: verification.error },
        },
      });

      notifyUser(user.id, 'payment:failed', {
        paymentId: id,
        message: 'Verificação do pagamento falhou.',
      });

      return;
    }

    logger.info(`✅ Payment ${id} confirmed on-chain!`);
    await processConfirmedPayment(payment, verification.event);

  } catch (error) {
    logger.error(`Error verifying payment ${id}:`, error);
    throw error;
  }
}

/**
 * Processar pagamento confirmado
 */
async function processConfirmedPayment(payment, eventData) {
  const { id, type, subscriptionId, creatorId, userId, amountUSD, creator, user } = payment;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar status do pagamento
      await tx.payment.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          confirmedAt: new Date(),
          paidAt: new Date(),
        },
      });

      // 2. Calcular valores
      const platformFee   = parseFloat(amountUSD) * 0.10;
      const creatorAmount = parseFloat(amountUSD) - platformFee;

      // 3. Actualizar saldo do criador
      await tx.creatorBalance.upsert({
        where: { creatorId },
        create: {
          creatorId,
          availableUSD: creatorAmount,
          lifetimeEarnings: creatorAmount,
          lastPaymentAt: new Date(),
        },
        update: {
          availableUSD:      { increment: creatorAmount },
          lifetimeEarnings:  { increment: creatorAmount },
          lastPaymentAt: new Date(),
        },
      });

      // 4. Activar assinatura se aplicável
      if ((type === 'SUBSCRIPTION' || type === 'SUBSCRIPTION_RENEWAL') && subscriptionId) {
        await tx.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        logger.info(`Subscription ${subscriptionId} activated`);
      }

      // 5. Notificação para o criador
      // ⚠️  CORRIGIDO: usar creator.userId (User), não creatorId (Creator)
      await tx.notification.create({
        data: {
          userId: creator.userId,
          type: 'PAYMENT',
          title: 'Pagamento recebido',
          message: `Recebeste $${creatorAmount.toFixed(2)} USDC de um ${type.toLowerCase()}`,
          metadata: { paymentId: id, amount: creatorAmount, type },
        },
      });

      // 6. Notificação para o utilizador
      await tx.notification.create({
        data: {
          userId,
          type: 'PAYMENT',
          title: 'Pagamento confirmado',
          message: `O teu pagamento de $${amountUSD} foi confirmado`,
          metadata: { paymentId: id, amount: amountUSD, type },
        },
      });

      logger.info(`✅ Payment ${id} processed successfully`);
    });

    // 7. Emitir eventos Socket.IO em tempo real
    notifyUser(userId, 'payment:confirmed', {
      paymentId: id,
      amount: amountUSD,
      type,
      message: 'Pagamento confirmado com sucesso!',
    });

    notifyUser(creator.userId, 'payment:received', {
      paymentId: id,
      amount: parseFloat(amountUSD) * 0.90,
      type,
      message: `Novo pagamento recebido: $${(parseFloat(amountUSD) * 0.90).toFixed(2)} USDC`,
    });

    // TODO: Enviar emails de confirmação

  } catch (error) {
    logger.error(`Error processing confirmed payment ${id}:`, error);
    throw error;
  }
}

/**
 * Iniciar o monitor
 */
export function startBlockchainMonitor() {
  logger.info('Starting blockchain monitor...');

  cron.schedule('*/30 * * * * *', async () => {
    await monitorPendingPayments();
  });

  logger.info('✅ Blockchain monitor started (runs every 30 seconds)');
}

/**
 * Trigger manual para testes
 */
export async function triggerMonitor() {
  logger.info('Manually triggering blockchain monitor...');
  await monitorPendingPayments();
}

export default {
  startBlockchainMonitor,
  triggerMonitor,
};