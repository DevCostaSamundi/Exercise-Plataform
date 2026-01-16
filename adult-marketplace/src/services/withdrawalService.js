import api from './api';

const withdrawalService = {
  /**
   * Obter saldo do criador
   */
  getCreatorBalance: async () => {
    const response = await api.get('/withdrawals/balance');
    return response.data;
  },

  /**
   * Solicitar saque
   */
  requestWithdrawal: async (data) => {
    const response = await api.post('/withdrawals', data);
    return response.data;
  },

  /**
   * Listar saques
   */
  getWithdrawals: async (params = {}) => {
    const response = await api.get('/withdrawals', { params });
    return response.data;
  },

  /**
   * Cancelar saque pendente
   */
  cancelWithdrawal: async (withdrawalId) => {
    const response = await api.delete(`/withdrawals/${withdrawalId}`);
    return response.data;
  },

  /**
   * Obter detalhes de um saque
   */
  getWithdrawalDetails: async (withdrawalId) => {
    const response = await api.get(`/withdrawals/${withdrawalId}`);
    return response.data;
  },
};

export default withdrawalService;