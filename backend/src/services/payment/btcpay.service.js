import axios from 'axios';
import crypto from 'crypto';
import logger from '../../utils/logger.js';

export class BTCPayService {
  constructor() {
    this.serverUrl = process.env.BTCPAY_SERVER_URL; // https://btcpay.yourdomain.com
    this. storeId = process.env. BTCPAY_STORE_ID;
    this.apiKey = process.env.BTCPAY_API_KEY;
    this.webhookSecret = process.env. BTCPAY_WEBHOOK_SECRET;
    
    this.client = axios.create({
      baseURL: `${this.serverUrl}/api/v1`,
      headers: {
        'Authorization': `token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Criar invoice (pagamento)
   */
  async createInvoice(data) {
    try {
      const response = await this.client.post(`/stores/${this.storeId}/invoices`, {
        amount: data.amount,
        currency: data.currency,
        metadata: {
          orderId: data.orderId,
          itemDesc: data.description || 'Payment',
        },
        checkout: {
          speedPolicy: 'MediumSpeed', // LowSpeed, MediumSpeed, HighSpeed
          paymentMethods: ['BTC', 'BTC-LightningNetwork'],
          defaultPaymentMethod: 'BTC',
          expirationMinutes: 15,
          redirectURL: `${process.env. FRONTEND_URL}/payment/success`,
        },
      });

      logger. info('BTCPay invoice created:', response.data);
      
      return {
        orderId: response.data.id,
        depositAddress: response.data.addresses?. BTC,
        lightningInvoice: response.data.addresses?.['BTC-LightningNetwork'],
        checkoutLink: response.data.checkoutLink,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        amount: response.data.amount,
      };
    } catch (error) {
      logger.error('BTCPay create invoice error:', error.response?.data || error.message);
      throw new Error('Failed to create BTCPay invoice');
    }
  }

  /**
   * Obter status do invoice
   */
  async getInvoiceStatus(invoiceId) {
    try {
      const response = await this.client.get(`/stores/${this.storeId}/invoices/${invoiceId}`);
      
      return {
        status: response.data.status,
        amount: response.data.amount,
        currency: response.data.currency,
        expiresAt: response.data.expirationTime,
      };
    } catch (error) {
      logger.error('BTCPay get invoice error:', error);
      throw error;
    }
  }

  /**
   * Validar webhook
   */
  validateWebhookSignature(requestBody, signature) {
    const hmac = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(requestBody))
      .digest('hex');
    
    return `sha256=${hmac}` === signature;
  }

  /**
   * Criar webhook (setup inicial)
   */
  async createWebhook(callbackUrl) {
    try {
      const response = await this. client.post(`/stores/${this.storeId}/webhooks`, {
        url: callbackUrl,
        enabled: true,
        automaticRedelivery: true,
        secret: this.webhookSecret,
        authorizedEvents: {
          everything: false,
          specificEvents: [
            'InvoiceReceivedPayment',
            'InvoiceProcessing',
            'InvoiceExpired',
            'InvoiceSettled',
            'InvoiceInvalid',
          ],
        },
      });

      logger.info('BTCPay webhook created:', response.data);
      return response.data;
    } catch (error) {
      logger. error('BTCPay create webhook error:', error);
      throw error;
    }
  }

  /**
   * Obter taxa de câmbio BTC/USD
   */
  async getExchangeRate() {
    try {
      const response = await this.client.get(`/stores/${this.storeId}/rates`);
      return response.data. find(r => r.currencyPair === 'BTC_USD')?.rate;
    } catch (error) {
      logger.error('BTCPay get rate error:', error);
      return null;
    }
  }
}