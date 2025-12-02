import axios from 'axios';
import logger from '../../utils/logger.js';

export class PIXService {
  constructor() {
    // Usando Mercado Pago como exemplo
    this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    this.baseURL = 'https://api.mercadopago.com/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Criar pagamento PIX
   */
  async createPayment(data) {
    try {
      const response = await this.client.post('/payments', {
        transaction_amount: data.amount,
        description: data.description || 'PrideConnect Payment',
        payment_method_id: 'pix',
        payer: {
          email: data.email || 'user@prideconnect.com',
        },
        notification_url: `${process.env.API_URL}/webhooks/payment/pix`,
        external_reference: data.orderId,
      });

      logger.info('PIX payment created:', response.data);

      return {
        orderId: response.data.id.toString(),
        qrCode: response.data.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: response.data.point_of_interaction?.transaction_data?.qr_code_base64,
        pixCopyPaste: response.data.point_of_interaction?.transaction_data?.qr_code,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
      };
    } catch (error) {
      logger.error('PIX create payment error:', error.response?.data || error.message);
      throw new Error('Failed to create PIX payment');
    }
  }

  /**
   * Obter status do pagamento
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      
      return {
        status: this.mapStatus(response.data.status),
        amount: response.data.transaction_amount,
      };
    } catch (error) {
      logger.error('PIX get status error:', error);
      throw error;
    }
  }

  /**
   * Mapear status do Mercado Pago
   */
  mapStatus(mpStatus) {
    const statusMap = {
      'pending': 'PENDING',
      'approved': 'COMPLETED',
      'authorized': 'COMPLETED',
      'in_process': 'CONFIRMING',
      'in_mediation': 'CONFIRMING',
      'rejected': 'FAILED',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'charged_back': 'REFUNDED',
    };
    return statusMap[mpStatus] || 'PENDING';
  }

  /**
   * Validar webhook
   */
  validateWebhook(requestBody) {
    // Mercado Pago envia notificações diferentes
    // Implementar validação conforme documentação
    return true;
  }
}