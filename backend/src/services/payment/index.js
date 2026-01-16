// services/payment/index.js

import nowpaymentsService from './nowpayments.service.js';
import { PIXService } from './pix.service.js';
import prisma from '../../config/database.js';
import logger from '../../utils/logger.js';

class PaymentService {
  constructor() {
    this.nowpayments = nowpaymentsService;
    this.pix = new PIXService();
  }

  /**
   * ⭐ MÉTODO PRINCIPAL - Criar pagamento (detecta automaticamente o gateway)
   */
  async createPayment({
    userId,
    creatorId,
    type,
    amountUSD,
    cryptoCurrency, // Ex: 'USDT_TRC20', 'PIX'
    subscriptionId,
    postId,
    messageId,
    ipAddress,
    userAgent,
  }) {
    logger.info('Creating payment:', {
      userId,
      creatorId,
      type,
      amountUSD,
      cryptoCurrency,
    });

    // ⭐ Detectar se é PIX ou Crypto
    if (cryptoCurrency === 'PIX') {
      return await this.createPixPayment({
        userId,
        creatorId,
        type,
        amountUSD,
        subscriptionId,
        postId,
        messageId,
      });
    } else {
      return await this.createCryptoPayment({
        userId,
        creatorId,
        type,
        amountUSD,
        cryptoCurrency,
        subscriptionId,
        postId,
        messageId,
      });
    }
  }

  /**
   * Criar pagamento PIX
   */
  async createPixPayment(data) {
    const { userId, creatorId, type, amountUSD } = data;
    
    // Converter USD para BRL (exemplo: taxa 5.5)
    const brlRate = 5.5;
    const amountBRL = amountUSD * brlRate;

    // Criar no PIX gateway
    const pixPayment = await this.pix.createPayment({
      amount: amountBRL,
      orderId: `pix_${Date.now()}_${userId}`,
      description: `PrideConnect - ${type}`,
    });

    // Salvar no banco
    const payment = await prisma.payment.create({
      data: {
        userId,
        creatorId,
        type,
        amountUSD,
        currency: 'BRL',
        cryptoCurrency: 'PIX',
        cryptoAmount: amountBRL.toFixed(2),
        cryptoAddress: pixPayment.pixCopyPaste,
        expectedAmount: amountBRL.toFixed(2),
        status: 'PENDING',
        gateway: 'PIX',
        gatewayOrderId: pixPayment.orderId,
        gatewayData: pixPayment,
        expiresAt: pixPayment.expiresAt,
        platformFee: amountUSD * 0.10,
        gatewayFee: amountUSD * 0.01, // PIX fee ~1%
        netAmount: amountUSD * 0.89,
        metadata: data,
      },
    });

    return {
      paymentId: payment.id,
      type: 'pix',
      amountBRL: amountBRL.toFixed(2),
      pixCode: pixPayment.pixCopyPaste,
      qrCode: pixPayment.qrCode,
      qrCodeBase64: pixPayment.qrCodeBase64,
      expiresAt: pixPayment.expiresAt,
      status: payment.status,
    };
  }

  /**
   * Criar pagamento Crypto
   */
  async createCryptoPayment(data) {
    const { userId, creatorId, type, amountUSD, cryptoCurrency } = data;
    
    // Normalizar nome da moeda
    const payCurrency = cryptoCurrency.toLowerCase().replace('_', '');

    // Criar no NowPayments
    const cryptoPayment = await this.nowpayments.createPayment({
      amount: amountUSD,
      currency: 'USD',
      payCurrency: payCurrency,
      orderId: `crypto_${Date.now()}_${userId}`,
      orderDescription: `PrideConnect - ${type}`,
      userId,
      creatorId,
      type,
      metadata: data,
    });

    return {
      paymentId: cryptoPayment.paymentId,
      type: 'crypto',
      payCurrency: cryptoPayment.payCurrency,
      payAddress: cryptoPayment.payAddress,
      payAmount: cryptoPayment.payAmount,
      qrCode: cryptoPayment.qrCode,
      qrCodeBase64: cryptoPayment.qrCodeBase64,
      expiresAt: cryptoPayment.expiresAt,
      status: cryptoPayment.status,
      simulated: cryptoPayment.simulated,
    };
  }

  /**
   * Verificar status de pagamento
   */
  async checkPaymentStatus(paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Se já está completo, não precisa checar
    if (payment.status === 'COMPLETED') {
      return payment;
    }

    // Checar no gateway
    let gatewayStatus;
    
    if (payment.gateway === 'NOWPAYMENTS') {
      gatewayStatus = await this.nowpayments.getPaymentStatus(payment.gatewayOrderId);
      
      // Mapear status
      const statusMap = {
        'waiting': 'WAITING',
        'confirming': 'CONFIRMING',
        'confirmed': 'CONFIRMING',
        'sending': 'CONFIRMING',
        'finished': 'COMPLETED',
        'failed': 'FAILED',
        'refunded': 'REFUNDED',
        'expired': 'EXPIRED',
      };

      const newStatus = statusMap[gatewayStatus.payment_status] || payment.status;
      
      if (newStatus !== payment.status) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: newStatus,
            confirmedAt: newStatus === 'COMPLETED' ? new Date() : null,
          },
        });
        
        payment.status = newStatus;
      }
    } else if (payment.gateway === 'PIX') {
      gatewayStatus = await this.pix.getPaymentStatus(payment.gatewayOrderId);
      
      if (gatewayStatus.status !== payment.status) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: gatewayStatus.status,
            confirmedAt: gatewayStatus.status === 'COMPLETED' ? new Date() : null,
          },
        });
        
        payment.status = gatewayStatus.status;
      }
    }

    return payment;
  }
}

export default new PaymentService();