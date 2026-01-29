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

  // Adicionar fundos (deposit USDC)
  async addFunds(data) {
    const response = await api.post('/wallet/add-funds', data);
    return response.data;
  }
}

export default new WalletService();