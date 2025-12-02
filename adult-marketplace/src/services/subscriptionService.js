const API_URL = 'http://localhost:5000/api/v1';

class SubscriptionService {
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Verificar se está inscrito
  async checkSubscription(creatorId) {
    const response = await fetch(
      `${API_URL}/subscriptions/check/${creatorId}`,
      {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to check subscription');
    }

    return response.json();
  }

  // Listar assinaturas
  async getUserSubscriptions(status = 'ACTIVE') {
    const response = await fetch(
      `${API_URL}/subscriptions?status=${status}`,
      {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get subscriptions');
    }

    return response.json();
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId) {
    const response = await fetch(
      `${API_URL}/subscriptions/${subscriptionId}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return response.json();
  }
}

export default new SubscriptionService();