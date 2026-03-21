import api from './api';

class NotificationService {
  /**
   * Listar notificações
   * ✅ CORRIGIDO: era api. get (espaço)
   */
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data;
  }

  /**
   * Marcar como lida
   * ✅ CORRIGIDO: era PUT — backend usa PATCH /:id/read
   */
  async markAsRead(notificationId) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  /**
   * Marcar como não lida
   * ✅ ADICIONADO: existia no backend mas estava ausente no service
   */
  async markAsUnread(notificationId) {
    const response = await api.patch(`/notifications/${notificationId}/unread`);
    return response.data;
  }

  /**
   * Marcar todas como lidas
   * ✅ CORRIGIDO: era PUT /read-all — backend usa PATCH /mark-all-read
   */
  async markAllAsRead() {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  }

  /**
   * Deletar notificação
   * ✅ CORRIGIDO: era api. delete (espaço)
   */
  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  /**
   * Deletar múltiplas notificações
   * ✅ ADICIONADO: existia no backend mas estava ausente no service
   */
  async bulkDelete(ids) {
    const response = await api.delete('/notifications/bulk-delete', { data: { ids } });
    return response.data;
  }

  /**
   * Obter contagem de não lidas
   */
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  }

  /**
   * Atualizar configurações de notificação
   */
  async updateSettings(settings) {
    const response = await api.put('/users/notification-settings', settings);
    return response.data;
  }
}

export default new NotificationService();