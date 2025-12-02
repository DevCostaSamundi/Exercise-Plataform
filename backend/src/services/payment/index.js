import { NOWPaymentsService } from './nowpayments.service.js';
import { BTCPayService } from './btcpay.service.js';
import { PIXService } from './pix.service.js';
import prisma from '../../config/database.js';
import logger from '../../utils/logger.js';
import notificationService from '../notification.service.js';

class PaymentService {
  constructor() {
    // Inicializar gateways
    this.nowpayments = new NOWPaymentsService();
    this.btcpay = new BTCPayService();
    this.pix = new PIXService();
    
    // Mapeamento de moedas para gateways
    this.gatewayMap = {
      // NOWPayments - Maioria das cryptos
      'USDT_TRC20': 'nowpayments',
      'USDT_ERC20': 'nowpayments',
      'USDT_BEP20': 'nowpayments',
      'ETH': 'nowpayments',
      'XMR': 'nowpayments',
      'LTC': 'nowpayments',
      'BCH': 'nowpayments',
      'BNB': 'nowpayments',
      'USDC': 'nowpayments',
      'DAI': 'nowpayments',
      'MATIC': 'nowpayments',
      
      // BTCPay - Bitcoin principal
      'BTC': 'btcpay',
      'BTC_LIGHTNING': 'btcpay',
      
      // PIX - Brasil
      'PIX': 'pix',
    };
  }

  /**
   * Criar pagamento
   */
  async createPayment(data) {
    const {
      userId,
      creatorId,
      type,
      amountUSD,
      cryptoCurrency,
      subscriptionId,
      postId,
      messageId,
      ipAddress,
      userAgent,
    } = data;

    try {
      // Calcular taxas
      const platformFeePercent = 0.10; // 10%
      const platformFee = amountUSD * platformFeePercent;
      
      let gatewayFee = 0;
      const gateway = this.gatewayMap[cryptoCurrency];
      
      if (gateway === 'nowpayments') {
        gatewayFee = amountUSD * 0.005; // 0.5%
      }
      
      const netAmount = amountUSD - platformFee - gatewayFee;

      // Criar registro no banco
      const payment = await prisma.payment.create({
        data: {
          userId,
          creatorId,
          type,
          amountUSD,
          currency: 'USD',
          cryptoCurrency,
          gateway,
          platformFee,
          gatewayFee,
          netAmount,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
          ipAddress,
          userAgent,
          metadata: {
            subscriptionId,
            postId,
            messageId,
          },
        },
      });

      // Criar pagamento no gateway
      let gatewayResponse;
      
      switch (gateway) {
        case 'nowpayments':
          gatewayResponse = await this.nowpayments.createPayment({
            price_amount: amountUSD,
            price_currency: 'usd',
            pay_currency: cryptoCurrency.toLowerCase().replace('_', ''),
            order_id: payment.id,
            order_description: this.getOrderDescription(type),
            ipn_callback_url: `${process.env.API_URL}/webhooks/payment/nowpayments`,
          });
          break;
          
        case 'btcpay':
          gatewayResponse = await this.btcpay.createInvoice({
            amount: amountUSD,
            currency: 'USD',
            orderId: payment.id,
            notificationUrl: `${process.env.API_URL}/webhooks/payment/btcpay`,
          });
          break;
          
        case 'pix':
          gatewayResponse = await this.pix.createPayment({
            amount: amountUSD * 5.5, // Converter para BRL
            orderId: payment.id,
          });
          break;
          
        default:
          throw new Error(`Gateway não suportado: ${gateway}`);
      }

      // Atualizar com dados do gateway
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayOrderId: gatewayResponse.orderId || gatewayResponse.payment_id,
          cryptoAddress: gatewayResponse.pay_address || gatewayResponse.depositAddress,
          expectedAmount: gatewayResponse.pay_amount?. toString(),
          gatewayData: gatewayResponse,
        },
      });

      return {
        paymentId: updatedPayment.id,
        cryptoCurrency,
        cryptoAmount: gatewayResponse.pay_amount,
        address: gatewayResponse.pay_address || gatewayResponse.depositAddress,
        qrCode: gatewayResponse.qr_code || null,
        expiresAt: updatedPayment.expiresAt,
        gatewayData: gatewayResponse,
      };
      
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Verificar status do pagamento
   */
  async checkPaymentStatus(paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status === 'COMPLETED') {
      return payment;
    }

    // Consultar gateway
    let status;
    
    switch (payment.gateway) {
      case 'nowpayments':
        status = await this.nowpayments.getPaymentStatus(payment.gatewayOrderId);
        break;
      case 'btcpay':
        status = await this.btcpay.getInvoiceStatus(payment.gatewayOrderId);
        break;
      default:
        return payment;
    }

    // Atualizar status se mudou
    if (status.status !== payment.status) {
      return await this.updatePaymentStatus(payment.id, status);
    }

    return payment;
  }

  /**
   * Atualizar status do pagamento
   */
  async updatePaymentStatus(paymentId, statusData) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        creator: true,
      },
    });

    if (! payment) {
      throw new Error('Payment not found');
    }

    const newStatus = this.mapGatewayStatus(statusData.status, payment.gateway);
    
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        actuallyPaid: statusData.actually_paid?.toString(),
        txHash: statusData.tx_hash,
        confirmations: statusData.confirmations || 0,
        ...(newStatus === 'COMPLETED' && { confirmedAt: new Date() }),
      },
    });

    // Se completou, processar
    if (newStatus === 'COMPLETED' && payment.status !== 'COMPLETED') {
      await this.processCompletedPayment(updated);
    }

    return updated;
  }

  /**
   * Processar pagamento completado
   */
  async processCompletedPayment(payment) {
    try {
      logger.info(`Processing completed payment: ${payment.id}`);

      switch (payment.type) {
        case 'SUBSCRIPTION':
        case 'SUBSCRIPTION_RENEWAL':
          await this.activateSubscription(payment);
          break;
          
        case 'PPV_MESSAGE':
          await this.unlockMessage(payment);
          break;
          
        case 'PPV_POST':
          await this.unlockPost(payment);
          break;
          
        case 'TIP':
          await this.processTip(payment);
          break;
          
        case 'WALLET_DEPOSIT':
          await this.addToWallet(payment);
          break;
      }

      // Adicionar ao saldo do criador
      if (payment.creatorId) {
        await this.addToCreatorBalance(payment.creatorId, payment.netAmount);
      }

      // Notificar sobre pagamento recebido
      await notificationService.notifyPaymentReceived(payment);

      logger.info(`Payment processed successfully: ${payment.id}`);
    } catch (error) {
      logger.error(`Error processing payment ${payment.id}:`, error);
      throw error;
    }
  }

  /**
   * Adicionar ao saldo do criador
   */
  async addToCreatorBalance(creatorId, amount) {
    await prisma.creatorBalance.upsert({
      where: { creatorId },
      create: {
        creatorId,
        availableUSD: amount,
        lifetimeEarnings: amount,
        lastPaymentAt: new Date(),
      },
      update: {
        availableUSD: { increment: amount },
        lifetimeEarnings: { increment: amount },
        lastPaymentAt: new Date(),
      },
    });
  }

  /**
   * Ativar assinatura após pagamento confirmado
   */
  async activateSubscription(payment) {
    try {
      const metadata = payment.metadata || {};
      
      // Verificar se já existe assinatura ativa
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: payment.userId,
          creatorId: payment.creatorId,
          status: 'ACTIVE',
        },
      });

      if (existingSubscription) {
        // Apenas renovar
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
          },
        });
        
        logger.info(`Subscription renewed: ${existingSubscription.id}`);
        return;
      }

      // Criar nova assinatura
      const subscription = await prisma.subscription.create({
        data: {
          userId: payment.userId,
          creatorId: payment.creatorId,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          autoRenew: true,
          amount: payment.amountUSD,
          paymentMethod: payment.cryptoCurrency,
        },
      });

      logger.info(`Subscription created: ${subscription.id}`);

      // TODO: Enviar email de boas-vindas
      // TODO: Notificar criador (novo assinante)
      
    } catch (error) {
      logger.error('Error activating subscription:', error);
      throw error;
    }
  }

  /**
   * Desbloquear mensagem paga
   */
  async unlockMessage(payment) {
    const metadata = payment.metadata;
    
    if (metadata.messageId) {
      await prisma.message.update({
        where: { id: metadata.messageId },
        data: {
          contentIsPaid: true,
        },
      });
    }
  }

  /**
   * Desbloquear post pago
   */
  async unlockPost(payment) {
    const metadata = payment.metadata;
    
    if (metadata.postId) {
      await prisma.postPurchase.create({
        data: {
          userId: payment.userId,
          postId: metadata.postId,
          paymentId: payment.id,
        },
      });
    }
  }

  /**
   * Processar gorjeta
   */
  async processTip(payment) {
    // Gorjetas são apenas registradas e adicionadas ao saldo
    // O saldo já é adicionado em processCompletedPayment
    logger.info(`Tip processed: ${payment.amountUSD} USD to creator ${payment.creatorId}`);
  }

  /**
   * Adicionar ao saldo da carteira
   */
  async addToWallet(payment) {
    await prisma.wallet.upsert({
      where: { userId: payment.userId },
      create: {
        userId: payment.userId,
        balanceUSD: payment.amountUSD,
      },
      update: {
        balanceUSD: { increment: payment.amountUSD },
      },
    });
  }

  /**
   * Helper functions
   */
  getOrderDescription(type) {
    const descriptions = {
      SUBSCRIPTION: 'Monthly Subscription',
      SUBSCRIPTION_RENEWAL: 'Subscription Renewal',
      PPV_MESSAGE: 'Unlock Private Message',
      PPV_POST: 'Unlock Premium Post',
      TIP: 'Tip to Creator',
      WALLET_DEPOSIT: 'Wallet Deposit',
    };
    return descriptions[type] || 'Payment';
  }

  mapGatewayStatus(gatewayStatus, gateway) {
    if (gateway === 'nowpayments') {
      const statusMap = {
        'waiting': 'PENDING',
        'confirming': 'CONFIRMING',
        'confirmed': 'CONFIRMING',
        'sending': 'CONFIRMING',
        'finished': 'COMPLETED',
        'failed': 'FAILED',
        'refunded': 'REFUNDED',
        'expired': 'EXPIRED',
        'partially_paid': 'PARTIALLY_PAID',
      };
      return statusMap[gatewayStatus] || 'PENDING';
    }
    
    if (gateway === 'btcpay') {
      const statusMap = {
        'New': 'PENDING',
        'Processing': 'CONFIRMING',
        'Settled': 'COMPLETED',
        'Expired': 'EXPIRED',
        'Invalid': 'FAILED',
      };
      return statusMap[gatewayStatus] || 'PENDING';
    }
    
    return 'PENDING';
  }
}

export default new PaymentService();