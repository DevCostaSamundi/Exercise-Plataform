import api from './api';

class MessageService {
  // Listar conversas
  async getConversations(params = {}) {
    const response = await api.get('/messages/conversations', { params });
    return response.data;
  }

  // Obter conversa específica
  async getConversation(conversationId) {
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return response.data;
  }

  // Criar conversa
  async createConversation(recipientId) {
    const response = await api.post('/messages/conversations', { recipientId });
    return response.data;
  }

  // Listar mensagens de uma conversa
  async getMessages(conversationId, params = {}) {
    const response = await api.get(`/messages/conversations/${conversationId}/messages`, { params });
    return response.data;
  }

  // Enviar mensagem
  async sendMessage(data) {
    const response = await api.post('/messages', data);
    return response.data;
  }

  // Enviar mensagem com arquivo
  async sendMessageWithFile(formData) {
    const response = await api.post('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Marcar mensagens como lidas
  async markAsRead(conversationId) {
    const response = await api.post(`/messages/conversations/${conversationId}/read`);
    return response.data;
  }

  // Deletar mensagem
  async deleteMessage(messageId) {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  }

  // Obter contagem de não lidas
  async getUnreadCount() {
    const response = await api.get('/messages/unread-count');
    return response.data;
  }
}

export default new MessageService();