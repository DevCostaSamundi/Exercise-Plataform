import api from './api';

class WithdrawalService {
  // Obter saldo do criador
  async getBalance() {
    const response = await api.get('/withdrawals/balance');
    return response.data;
  }

  // Solicitar saque
  async requestWithdrawal(data) {
    const response = await api.post('/withdrawals', data);
    return response.data;
  }

  // Listar saques
  async getWithdrawals(params = {}) {
    const response = await api.get('/withdrawals', { params });
    return response.data;
  }

  // Cancelar saque
  async cancelWithdrawal(withdrawalId) {
    const response = await api.delete(`/withdrawals/${withdrawalId}`);
    return response.data;
  }
}

export default new WithdrawalService();