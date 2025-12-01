const API_URL = 'http://localhost:5000/api/v1';

class MessageService {
  // Obter token de autenticação
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Buscar todas as conversas
  async getConversations(status = 'active') {
    const response = await fetch(
      `${API_URL}/messages/conversations?status=${status}`,
      {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar conversas');
    }

    return response.json();
  }

  // Buscar mensagens de uma conversa
  async getMessages(conversationId, limit = 50, before = null) {
    let url = `${API_URL}/messages/${conversationId}?limit=${limit}`;
    if (before) {
      url += `&before=${before}`;
    }

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar mensagens');
    }

    return response.json();
  }

  // Enviar mensagem
  async sendMessage(conversationId, recipientId, content, type = 'text') {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        conversationId,
        recipientId,
        type,
        content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao enviar mensagem');
    }

    return response.json();
  }

  // Criar ou buscar conversa
  async getOrCreateConversation(recipientId) {
    const response = await fetch(`${API_URL}/messages/conversations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ recipientId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar conversa');
    }

    return response.json();
  }

  // Marcar mensagem como lida
  async markAsRead(messageId) {
    const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao marcar mensagem como lida');
    }

    return response.json();
  }

  // Upload de mídia
  async uploadMedia(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/messages/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer upload');
    }

    return response.json();
  }

  // Enviar mensagem paga
  async sendPaidMessage(conversationId, recipientId, content, price) {
    const response = await fetch(`${API_URL}/messages/paid`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        conversationId,
        recipientId,
        content,
        price,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao enviar mensagem paga');
    }

    return response.json();
  }

  // Desbloquear mensagem paga
  async unlockPaidMessage(messageId, paymentMethod = 'crypto') {
    const response = await fetch(`${API_URL}/messages/${messageId}/unlock`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ paymentMethod }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao desbloquear mensagem');
    }

    return response.json();
  }
}

export default new MessageService();