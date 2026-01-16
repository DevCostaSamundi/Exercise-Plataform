import api from './api';

const paymentService = {
  /**
   * Obter moedas disponíveis
   */
  getAvailableCurrencies: async () => {
    const response = await api.get('/payments/currencies');
    return response.data;
  },

  /**
   * Estimar preço em cripto
   */
  estimatePrice: async (amountUSD, currency) => {
    const response = await api.get('/payments/estimate', {
      params: { amountUSD, currency },
    });
    return response. data;
  },

  /**
   * Criar pagamento
   */
  createPayment:  async (data) => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  /**
   * Verificar status do pagamento
   */
  checkPaymentStatus: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Listar pagamentos do usuário
   */
  getUserPayments: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response. data;
  },
};

export default paymentService;