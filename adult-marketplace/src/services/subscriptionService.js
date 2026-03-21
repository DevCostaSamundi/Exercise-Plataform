// src/services/subscriptionService.js
import api from './api';

const subscriptionService = {
  /**
   * GET /api/v1/subscriptions
   * Listar assinaturas do utilizador logado
   * ✅ CORRIGIDO: era api. get (espaço)
   */
  async getSubscriptions() {
    try {
      const response = await api.get('/subscriptions');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  },

  /**
   * Alias para getSubscriptions — compatibilidade com CreatorProfile.jsx
   */
  async getUserSubscriptions() {
    return this.getSubscriptions();
  },

  /**
   * POST /api/v1/subscriptions
   * Criar nova assinatura
   */
  async createSubscription(creatorId) {
    try {
      const response = await api.post('/subscriptions', { creatorId });
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  },

  /**
   * POST /api/v1/subscriptions/:id/cancel
   * Cancelar assinatura
   * ✅ CORRIGIDO: era api. post (espaço) e comentário com '/: id' (espaço)
   */
  async cancelSubscription(subscriptionId) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  /**
   * POST /api/v1/subscriptions/:id/pause
   * Pausar assinatura
   * ✅ ADICIONADO: estava ausente — chamado em Subscriptions.jsx
   */
  async pauseSubscription(subscriptionId) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/pause`);
      return response.data;
    } catch (error) {
      console.error('Error pausing subscription:', error);
      throw error;
    }
  },

  /**
   * POST /api/v1/subscriptions/:id/reactivate
   * Reativar assinatura cancelada
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const response = await api.post(`/subscriptions/${subscriptionId}/reactivate`);
      return response.data;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  },
};

export default subscriptionService;