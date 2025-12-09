import api from './api';

class TransactionService {
  // Listar transações
  async getTransactions(params = {}) {
    const response = await api.get('/transactions', { params });
    return response.data;
  }

  // Obter transação específica
  async getTransaction(transactionId) {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  }

  // Exportar transações (CSV)
  async exportTransactions(params = {}) {
    const response = await api.get('/transactions/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  // Download de recibo
  async downloadReceipt(transactionId) {
    const response = await api.get(`/transactions/${transactionId}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new TransactionService();