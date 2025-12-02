const API_URL = 'http://localhost:5000/api/v1';

class WithdrawalService {
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Obter saldo do criador
  async getBalance() {
    const response = await fetch(`${API_URL}/withdrawals/balance`, {
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar saldo');
    }

    return response.json();
  }

  // Solicitar saque
  async requestWithdrawal(data) {
    const response = await fetch(`${API_URL}/withdrawals`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response. ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao solicitar saque');
    }

    return response.json();
  }

  // Listar saques
  async getWithdrawals(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    
    const response = await fetch(`${API_URL}/withdrawals? ${queryParams.toString()}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar saques');
    }

    return response.json();
  }

  // Cancelar saque
  async cancelWithdrawal(withdrawalId) {
    const response = await fetch(`${API_URL}/withdrawals/${withdrawalId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao cancelar saque');
    }

    return response.json();
  }
}

export default new WithdrawalService();