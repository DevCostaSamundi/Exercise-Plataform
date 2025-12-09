import api from './api';

class NotificationService {
  // Listar notificações
  async getNotifications(params = {}) {
    const response = await api. get('/notifications', { params });
    return response.data;
  }

  // Marcar como lida
  async markAsRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  // Marcar todas como lidas
  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response. data;
  }

  // Deletar notificação
  async deleteNotification(notificationId) {
    const response = await api. delete(`/notifications/${notificationId}`);
    return response.data;
  }

  // Obter contagem de não lidas
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  }

  // Atualizar configurações de notificação
  async updateSettings(settings) {
    const response = await api.put('/users/notification-settings', settings);
    return response.data;
  }
}

export default new NotificationService();