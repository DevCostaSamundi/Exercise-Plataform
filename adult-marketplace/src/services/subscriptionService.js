import api from './api';

class SubscriptionService {
  // Criar assinatura
  async createSubscription(creatorId) {
    const response = await api.post(`/subscriptions/${creatorId}`);
    return response.data;
  }

  // Verificar se está inscrito
  async checkSubscription(creatorId) {
    const response = await api.get(`/subscriptions/check/${creatorId}`);
    return response.data;
  }

  // Listar assinaturas
  async getUserSubscriptions(status = 'ACTIVE') {
    const response = await api.get('/subscriptions', {
      params: { status }
    });
    return response.data;
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId) {
    const response = await api.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  }
}

export default new SubscriptionService();