import api from './api';

class PaymentService {
  // Obter moedas disponíveis
  async getAvailableCurrencies() {
    const response = await api.get('/payments/currencies');
    return response.data;
  }

  // Estimar preço em cripto
  async estimatePrice(amountUSD, currency) {
    const response = await api.get('/payments/estimate', {
      params: { amountUSD, currency }
    });
    return response.data;
  }

  // Criar pagamento
  async createPayment(data) {
    const response = await api.post('/payments', data);
    return response.data;
  }

  // Verificar status do pagamento
  async checkPaymentStatus(paymentId) {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  }

  // Listar pagamentos do usuário
  async getUserPayments(params = {}) {
    const response = await api.get('/payments', { params });
    return response.data;
  }
}

export default new PaymentService();