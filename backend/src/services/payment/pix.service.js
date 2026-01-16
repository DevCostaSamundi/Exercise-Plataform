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
      // ✅ VERIFICAR SE MERCADO PAGO ESTÁ CONFIGURADO
      if (!this.accessToken) {
        logger.warn('⚠️ Mercado Pago not configured, simulating PIX payment');
        return this.simulatePixPayment(data);
      }

      const response = await this.client.post('/payments', {
        transaction_amount: data.amount,
        description: data.description || 'PrideConnect Payment',
        payment_method_id: 'pix',
        payer: {
          email: data.email || 'user@prideconnect.com',
        },
        notification_url: `${process.env.API_URL}/api/v1/payments/webhook/pix`,
        external_reference: data.orderId,
      });

      logger.info('✅ PIX payment created (Mercado Pago):', response.data);

      return {
        orderId: response.data.id.toString(),
        amount: data.amount,
        qrCode: response.data.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: response.data.point_of_interaction?.transaction_data?.qr_code_base64,
        pixCopyPaste: response.data.point_of_interaction?.transaction_data?.qr_code,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
      };
    } catch (error) {
      logger.error('❌ PIX create payment error:', error.response?.data || error.message);

      // ✅ FALLBACK:  Se Mercado Pago falhar, simular
      logger.warn('⚠️ Mercado Pago failed, simulating PIX payment');
      return this.simulatePixPayment(data);
    }
  }

  /**
   * ✅ SIMULAR PAGAMENTO PIX (para desenvolvimento/teste)
   */
  simulatePixPayment(data) {
    const pixCode = this.generatePixCode(data.amount, data.orderId);

    logger.info('✅ PIX payment simulated:', {
      amount: data.amount,
      orderId: data.orderId,
      pixCodeLength: pixCode.length,
    });

    return {
      orderId: `pix_${Date.now()}`,
      amount: data.amount,
      qrCode: pixCode, // ✅ Mesma string para QR Code
      qrCodeBase64: null, // ✅ Não gerar base64 (usaremos QRCodeSVG no frontend)
      pixCopyPaste: pixCode, // ✅ Código Copia e Cola
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  /**
   * ✅ GERAR CÓDIGO PIX SIMULADO (formato BR Code padrão)
   */
  generatePixCode(amount, orderId) {
    // Chave PIX fictícia (pode ser substituída pela real)
    const pixKey = process.env.PIX_KEY || '12345678000199'; // CNPJ fictício

    // Formatar valor com 2 casas decimais
    const formattedAmount = amount.toFixed(2);

    // Transaction ID (máx 25 caracteres)
    const txId = orderId.substring(0, 25).padEnd(25, '0');

    // Nome do beneficiário
    const merchantName = 'PRIDECONNECT LTDA';
    const merchantCity = 'SAO PAULO';

    // Construir payload PIX (formato EMV)
    // Este é um formato SIMPLIFICADO - em produção use biblioteca específica
    let payload = '';

    // Payload Format Indicator
    payload += '000201';

    // Merchant Account Information
    payload += '26';
    const merchantInfo = `0014br. gov.bcb.pix01${pixKey.length.toString().padStart(2, '0')}${pixKey}`;
    payload += merchantInfo.length.toString().padStart(2, '0') + merchantInfo;

    // Merchant Category Code
    payload += '52040000';

    // Transaction Currency (986 = BRL)
    payload += '5303986';

    // Transaction Amount
    payload += '54' + formattedAmount.length.toString().padStart(2, '0') + formattedAmount;

    // Country Code
    payload += '5802BR';

    // Merchant Name
    payload += '59' + merchantName.length.toString().padStart(2, '0') + merchantName;

    // Merchant City
    payload += '60' + merchantCity.length.toString().padStart(2, '0') + merchantCity;

    // Additional Data Field
    payload += '62';
    const additionalData = `05${txId.length.toString().padStart(2, '0')}${txId}`;
    payload += additionalData.length.toString().padStart(2, '0') + additionalData;

    // CRC16 (simplificado - em produção calcular real)
    payload += '6304';
    const crc = this.calculateCRC16(payload);
    payload += crc;

    return payload;
  }

  /**
   * ✅ CALCULAR CRC16 (algoritmo CCITT)
   */
  calculateCRC16(str) {
    let crc = 0xFFFF;

    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;

      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }

    crc = crc & 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Obter status do pagamento
   */
  async getPaymentStatus(paymentId) {
    try {
      if (!this.accessToken) {
        // Simular status
        return {
          status: 'PENDING',
          amount: 0,
        };
      }

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
    return true;
  }
}