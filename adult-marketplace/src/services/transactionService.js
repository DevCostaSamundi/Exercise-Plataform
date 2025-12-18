import api from './api';

class TransactionService {
  /**
   * Listar transações
   */
  async getTransactions(params = {}) {
    const response = await api.get('/transactions', { params });
    return response.data;
  }

  /**
   * Exportar transações para CSV
   */
  async exportTransactions(params = {}) {
    const response = await api. get('/transactions/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Obter detalhes de uma transação
   */
  async getTransaction(transactionId) {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  }
}

export default new TransactionService();