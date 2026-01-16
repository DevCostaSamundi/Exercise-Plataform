import axios from 'axios';
import crypto from 'crypto';
import QRCode from 'qrcode';
import prisma from '../../config/database.js';
import paymentConfig from '../../config/payment.config.js';
import logger from '../../utils/logger.js';

class NowPaymentsService {
  constructor() {
    this.apiKey = paymentConfig.nowPayments.apiKey;
    this.ipnSecret = paymentConfig.nowPayments.ipnSecret;
    this.apiUrl = paymentConfig.nowPayments.apiUrl;

    console.log('🔍 DEBUG NowPayments Config: ');
    console.log('  API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('  IPN Secret:', this.ipnSecret ? 'SET' : 'NOT SET');
    console.log('  API URL:', this.apiUrl);

    // ✅ Verificar se está configurado
    this.isConfigured = ! !(this.apiKey && this.apiKey !== 'your_api_key_here');
    if (this.isConfigured) {
      this.client = axios.create({
        baseURL: this.apiUrl,
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      logger.info('✅ NowPayments service initialized (API Mode)');
    } else {
      logger.warn('⚠️ NowPayments NOT configured - Using SIMULATION mode');
    }
  }

  /**
   * Obter moedas disponíveis
   */
  // services/payment/nowpayments.service.js

  async getAvailableCurrencies() {
    try {
      // ⭐ Este endpoint é PÚBLICO - não precisa de API key
      const response = await axios.get('https://api.nowpayments.io/v1/currencies');
      return response.data.currencies;
    } catch (error) {
      logger.error('Error fetching currencies:', error);
      return ['usdttrc20', 'usdtbep20', 'usdcmatic', 'ltc', 'xmr', 'matic'];
    }
  }

  async getEstimate(amount, currency = 'USD', payCurrency = 'usdttrc20') {
    try {
      // ⭐ Este endpoint também é PÚBLICO
      const response = await axios.get('https://api.nowpayments.io/v1/estimate', {
        params: {
          amount,
          currency_from: currency.toLowerCase(),
          currency_to: payCurrency.toLowerCase()
        }
      });

      return {
        estimatedAmount: response.data.estimated_amount,
        payCurrency: payCurrency,
        currency: currency,
        minAmount: response.data.min_amount || 1,
        maxAmount: response.data.max_amount || 10000,
      };
    } catch (error) {
      logger.error('Error getting estimate:', error);

      // Fallback
      return {
        estimatedAmount: amount.toFixed(8),
        payCurrency: payCurrency,
        currency: currency,
        minAmount: 1,
        maxAmount: 10000,
        isEstimated: true,
      };
    }
  }

  /**
   * Criar pagamento
   */
  async createPayment({
    amount,
    currency = 'USD',
    payCurrency = 'usdttrc20',
    orderId,
    orderDescription,
    userId,
    creatorId,
    type,
    metadata = {}
  }) {
    // ✅ SE NÃO CONFIGURADO, SIMULAR
    if (!this.isConfigured) {
      return await this.createSimulatedPayment({
        amount,
        currency,
        payCurrency,
        orderId,
        orderDescription,
        userId,
        creatorId,
        type,
        metadata,
      });
    }

    try {
      const paymentData = {
        price_amount: parseFloat(amount),
        price_currency: currency.toLowerCase(),
        pay_currency: payCurrency.toLowerCase(),
        ipn_callback_url: `${paymentConfig.general.webhookUrl}/payments/webhook/nowpayments`,
        order_id: orderId,
        order_description: orderDescription || 'PrideConnect Payment',
        success_url: paymentConfig.general.successUrl,
        cancel_url: paymentConfig.general.cancelUrl,
        is_fee_paid_by_user: false,
        is_fixed_rate: true,
      };

      logger.info('Creating NowPayments payment:', paymentData);

      const response = await this.client.post('/payment', paymentData);
      const npPayment = response.data;

      logger.info('NowPayments response:', npPayment);

      // Salvar no banco
      const payment = await prisma.payment.create({
        data: {
          userId,
          creatorId,
          type,
          amountUSD: parseFloat(amount),
          currency,
          cryptoCurrency: payCurrency.toUpperCase(),
          cryptoAmount: npPayment.pay_amount?.toString(),
          cryptoAddress: npPayment.pay_address,
          expectedAmount: npPayment.pay_amount?.toString(),
          status: 'PENDING',
          gateway: 'NOWPAYMENTS',
          gatewayOrderId: npPayment.payment_id?.toString(),
          gatewayData: npPayment,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
          platformFee: parseFloat(amount) * 0.10,
          gatewayFee: parseFloat(amount) * 0.005,
          netAmount: parseFloat(amount) * 0.895,
          metadata: metadata,
        },
      });

      // Gerar QR Code
      let qrCodeBase64 = null;
      if (npPayment.pay_address) {
        try {
          qrCodeBase64 = await QRCode.toDataURL(npPayment.pay_address, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 512,
            margin: 2,
          });
          qrCodeBase64 = qrCodeBase64.replace(/^data:image\/png;base64,/, '');
        } catch (err) {
          logger.error('Error generating QR Code:', err);
        }
      }

      return {
        paymentId: payment.id,
        providerPaymentId: npPayment.payment_id,
        payAddress: npPayment.pay_address,
        payAmount: npPayment.pay_amount,
        payCurrency: payCurrency.toUpperCase(),
        paymentUrl: npPayment.invoice_url || null,
        qrCode: npPayment.pay_address,
        qrCodeBase64: qrCodeBase64,
        expiresAt: payment.expiresAt,
        status: payment.status,
      };

    } catch (error) {
      logger.error('Error creating NowPayments payment:', error.response?.data || error.message);

      // ✅ FALLBACK:  Criar pagamento simulado
      logger.warn('⚠️ NowPayments failed, creating simulated payment');
      return await this.createSimulatedPayment({
        amount,
        currency,
        payCurrency,
        orderId,
        orderDescription,
        userId,
        creatorId,
        type,
        metadata,
      });
    }
  }

  /**
   * ✅ CRIAR PAGAMENTO SIMULADO
   */
  async createSimulatedPayment({
    amount,
    currency,
    payCurrency,
    orderId,
    orderDescription,
    userId,
    creatorId,
    type,
    metadata,
  }) {
    logger.info('🎭 Creating SIMULATED NowPayments payment');

    // Gerar endereço simulado
    const simulatedAddress = this.generateSimulatedAddress(payCurrency);
    const estimatedAmount = parseFloat(amount).toFixed(8);

    // Salvar no banco
    const payment = await prisma.payment.create({
      data: {
        userId,
        creatorId,
        type,
        amountUSD: parseFloat(amount),
        currency,
        cryptoCurrency: payCurrency.toUpperCase(),
        cryptoAmount: estimatedAmount,
        cryptoAddress: simulatedAddress,
        expectedAmount: estimatedAmount,
        status: 'PENDING',
        gateway: 'NOWPAYMENTS',
        gatewayOrderId: `sim_${Date.now()}`,
        gatewayData: {
          simulated: true,
          note: 'This is a simulated payment for testing purposes',
        },
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        platformFee: parseFloat(amount) * 0.10,
        gatewayFee: parseFloat(amount) * 0.005,
        netAmount: parseFloat(amount) * 0.895,
        metadata: metadata,
      },
    });

    // Gerar QR Code
    let qrCodeBase64 = null;
    try {
      qrCodeBase64 = await QRCode.toDataURL(simulatedAddress, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 512,
        margin: 2,
      });
      qrCodeBase64 = qrCodeBase64.replace(/^data:image\/png;base64,/, '');
    } catch (err) {
      logger.error('Error generating QR Code:', err);
    }

    logger.info('✅ Simulated payment created:', payment.id);

    return {
      paymentId: payment.id,
      providerPaymentId: payment.gatewayOrderId,
      payAddress: simulatedAddress,
      payAmount: estimatedAmount,
      payCurrency: payCurrency.toUpperCase(),
      paymentUrl: null,
      qrCode: simulatedAddress,
      qrCodeBase64: qrCodeBase64,
      expiresAt: payment.expiresAt,
      status: payment.status,
      simulated: true, // Flag para frontend saber que é simulado
    };
  }

  /**
   * ✅ GERAR ENDEREÇO SIMULADO
   */
  generateSimulatedAddress(payCurrency) {
    const prefix = {
      'usdttrc20': 'T',
      'usdtbep20': '0x',
      'usdcmatic': '0x',
      'ltc': 'L',
      'xmr': '4',
      'matic': '0x',
      'btc': '1',
      'eth': '0x',
    };

    const addressPrefix = prefix[payCurrency.toLowerCase()] || '0x';
    const randomPart = crypto.randomBytes(20).toString('hex');

    if (addressPrefix === '0x') {
      return `0x${randomPart}`;
    } else if (addressPrefix === 'T') {
      return `T${randomPart.substring(0, 33)}`;
    } else if (addressPrefix === 'L') {
      return `L${randomPart.substring(0, 33)}`;
    } else if (addressPrefix === '4') {
      return `4${randomPart}${crypto.randomBytes(15).toString('hex')}`;
    } else {
      return `${addressPrefix}${randomPart}`;
    }
  }

  /**
   * Verificar status do pagamento
   */
  async getPaymentStatus(providerPaymentId) {
    // Se for simulado
    if (providerPaymentId.startsWith('sim_')) {
      return {
        payment_status: 'waiting',
        payment_id: providerPaymentId,
      };
    }

    if (!this.isConfigured) {
      return {
        payment_status: 'waiting',
        payment_id: providerPaymentId,
      };
    }

    try {
      const response = await this.client.get(`/payment/${providerPaymentId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching payment status:', error.response?.data || error.message);
      return {
        payment_status: 'waiting',
        payment_id: providerPaymentId,
      };
    }

  }
  /**
   * Validar webhook IPN
   */
  validateWebhook(body, signature) {
    const hmac = crypto
      .createHmac('sha512', this.ipnSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    return hmac === signature;
  }

  /**
   * Processar webhook
   */
  async processWebhook(webhookData, signature) {
    try {
      // Validar assinatura
      if (!this.validateWebhook(webhookData, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const { payment_id, payment_status, order_id } = webhookData;

      logger.info('Processing NowPayments webhook:', {
        payment_id,
        payment_status,
        order_id,
      });

      // Encontrar pagamento
      const payment = await prisma.payment.findFirst({
        where: { gatewayOrderId: payment_id?.toString() }
      });

      if (!payment) {
        logger.error('Payment not found:', payment_id);
        return { success: false, message: 'Payment not found' };
      }

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

      const newStatus = statusMap[payment_status] || 'PENDING';

      // Atualizar pagamento
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          actuallyPaid: webhookData.actually_paid?.toString(),
          confirmedAt: newStatus === 'COMPLETED' ? new Date() : payment.confirmedAt,
          gatewayData: webhookData,
        },
      });

      // Se completou, processar
      if (newStatus === 'COMPLETED' && payment.status !== 'COMPLETED') {
        await this.handleSuccessfulPayment(updatedPayment);
      }

      // Se falhou/expirou
      if (['EXPIRED', 'FAILED'].includes(newStatus)) {
        await this.handleFailedPayment(updatedPayment);
      }

      return { success: true, payment: updatedPayment };

    } catch (error) {
      logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Handle pagamento bem-sucedido
   */
  async handleSuccessfulPayment(payment) {
    logger.info(`✅ Payment successful:  ${payment.id}`);

    try {
      // Se for assinatura
      if (payment.type === 'SUBSCRIPTION') {
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
          // Renovar
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        } else {
          // Criar nova
          await prisma.subscription.create({
            data: {
              userId: payment.userId,
              creatorId: payment.creatorId,
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              autoRenew: true,
              amount: payment.amountUSD,
              paymentMethod: payment.cryptoCurrency,
            },
          });
        }

        // Adicionar saldo ao criador
        await prisma.creatorBalance.upsert({
          where: { creatorId: payment.creatorId },
          create: {
            creatorId: payment.creatorId,
            availableUSD: payment.netAmount,
            lifetimeEarnings: payment.netAmount,
            lastPaymentAt: new Date(),
          },
          update: {
            availableUSD: { increment: payment.netAmount },
            lifetimeEarnings: { increment: payment.netAmount },
            lastPaymentAt: new Date(),
          },
        });
      }

      // TODO: Enviar notificações

    } catch (error) {
      logger.error('Error handling successful payment:', error);
    }
  }

  /**
   * Handle pagamento falho
   */
  async handleFailedPayment(payment) {
    logger.warn(`❌ Payment failed: ${payment.id}`);
    // TODO: Enviar notificação ao usuário
  }
}

export default new NowPaymentsService();