const API_URL = 'http://localhost:5000/api/v1';

class PaymentService {
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Obter moedas disponíveis
  async getAvailableCurrencies() {
    const response = await fetch(`${API_URL}/payments/currencies`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar moedas');
    }

    return response.json();
  }

  // Estimar preço em cripto
  async estimatePrice(amountUSD, currency) {
    const response = await fetch(
      `${API_URL}/payments/estimate?amountUSD=${amountUSD}&currency=${currency}`,
      {
        credentials: 'include',
      }
    );

    if (! response.ok) {
      throw new Error('Erro ao estimar preço');
    }

    return response.json();
  }

  // Criar pagamento
  async createPayment(data) {
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: this. getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response. ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar pagamento');
    }

    return response.json();
  }

  // Verificar status do pagamento
  async checkPaymentStatus(paymentId) {
    const response = await fetch(`${API_URL}/payments/${paymentId}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response. ok) {
      throw new Error('Erro ao verificar status');
    }

    return response. json();
  }

  // Listar pagamentos do usuário
  async getUserPayments(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    
    const response = await fetch(`${API_URL}/payments?${queryParams. toString()}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar pagamentos');
    }

    return response. json();
  }
}

export default new PaymentService();