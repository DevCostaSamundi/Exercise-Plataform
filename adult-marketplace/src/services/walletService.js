import api from './api';

class WalletService {
  // Obter dados da carteira
  async getWallet(params = {}) {
    const response = await api.get('/wallet', { params });
    return response.data;
  }

  // Obter saldo
  async getBalance() {
    const response = await api.get('/wallet/balance');
    return response.data;
  }

  // Adicionar fundos
  async addFunds(data) {
    const response = await api.post('/wallet/add-funds', data);
    return response.data;
  }

  // Obter métodos de pagamento
  async getPaymentMethods() {
    const response = await api.get('/payments/methods');
    return response. data;
  }

  // Adicionar método de pagamento
  async addPaymentMethod(data) {
    const response = await api. post('/payments/methods', data);
    return response. data;
  }

  // Remover método de pagamento
  async removePaymentMethod(methodId) {
    const response = await api.delete(`/payments/methods/${methodId}`);
    return response.data;
  }

  // Definir método padrão
  async setDefaultPaymentMethod(methodId) {
    const response = await api.put(`/payments/methods/${methodId}/default`);
    return response.data;
  }
}

export default new WalletService();