import axios from 'axios';
import crypto from 'crypto';
import logger from '../../utils/logger.js';

export class NOWPaymentsService {
  constructor() {
    this.apiKey = process.env.NOWPAYMENTS_API_KEY;
    this.ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    this.baseURL = process.env.NOWPAYMENTS_SANDBOX === 'true' 
      ? 'https://api-sandbox.nowpayments.io/v1'
      : 'https://api.nowpayments.io/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Criar pagamento
   */
  async createPayment(data) {
    try {
      const response = await this.client.post('/payment', {
        price_amount: data.price_amount,
        price_currency: data.price_currency,
        pay_currency: data.pay_currency,
        order_id: data.order_id,
        order_description: data.order_description,
        ipn_callback_url: data.ipn_callback_url,
        success_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      });

      logger.info('NOWPayments payment created:', response.data);
      return response.data;
    } catch (error) {
      logger.error('NOWPayments create payment error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create payment');
    }
  }

  /**
   * Obter status do pagamento
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await this.client.get(`/payment/${paymentId}`);
      return response.data;
    } catch (error) {
      logger.error('NOWPayments get status error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Listar moedas disponíveis
   */
  async getAvailableCurrencies() {
    try {
      const response = await this.client.get('/currencies');
      return response.data.currencies;
    } catch (error) {
      logger.error('NOWPayments get currencies error:', error);
      throw error;
    }
  }

  /**
   * Estimar valor em cripto
   */
  async estimatePrice(amountUSD, currency) {
    try {
      const response = await this.client.get('/estimate', {
        params: {
          amount: amountUSD,
          currency_from: 'usd',
          currency_to: currency.toLowerCase(),
        },
      });
      return response.data;
    } catch (error) {
      logger.error('NOWPayments estimate error:', error);
      throw error;
    }
  }

  /**
   * Validar webhook IPN
   */
  validateIPNSignature(requestBody, signature) {
    const hmac = crypto
      .createHmac('sha512', this.ipnSecret)
      .update(JSON.stringify(requestBody))
      .digest('hex');
    
    return hmac === signature;
  }

  /**
   * Obter taxas mínimas/máximas
   */
  async getMinMaxAmounts(currency) {
    try {
      const response = await this.client.get(`/min-amount`, {
        params: {
          currency_from: 'usd',
          currency_to: currency.toLowerCase(),
        },
      });
      return response.data;
    } catch (error) {
      logger.error('NOWPayments min amount error:', error);
      return null;
    }
  }
}