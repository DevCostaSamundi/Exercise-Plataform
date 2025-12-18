import api from './api';

class SubscriptionService {
  /**
   * Criar nova assinatura
   */
  async createSubscription(creatorId, data = {}) {
    const response = await api.post(`/subscriptions/${creatorId}`, data);
    return response.data;
  }

  /**
   * Listar assinaturas do usuário
   */
  async getSubscriptions(params = {}) {
    const response = await api.get('/subscriptions', { params });
    return response.data;
  }

  /**
   * Verificar status de assinatura
   */
  async checkSubscription(creatorId) {
    const response = await api.get(`/subscriptions/check/${creatorId}`);
    return response.data;
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId) {
    const response = await api.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  }

  /**
   * Pausar assinatura
   */
  async pauseSubscription(subscriptionId) {
    const response = await api.put(`/subscriptions/${subscriptionId}/pause`);
    return response.data;
  }

  /**
   * Reativar assinatura
   */
  async resumeSubscription(subscriptionId) {
    const response = await api.put(`/subscriptions/${subscriptionId}/resume`);
    return response.data;
  }
}

export default new SubscriptionService();