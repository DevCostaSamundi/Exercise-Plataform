import api from './api';

class CreatorService {
  // Obter perfil do criador (público)
  async getCreatorProfile(creatorId) {
    const response = await api.get(`/creators/${creatorId}`);
    return response.data;
  }

  // Obter posts do criador (público)
  async getCreatorPosts(creatorId, params = {}) {
    const response = await api.get(`/creators/${creatorId}/posts`, { params });
    return response.data;
  }

  // Listar criadores
  async listCreators(filters = {}) {
    const response = await api.get('/creators', { params: filters });
    return response.data;
  }

  // Obter configurações (autenticado)
  async getSettings() {
    const response = await api.get('/creator/settings');
    return response.data;
  }

  // Atualizar configurações (autenticado)
  async updateSettings(formData) {
    const response = await api.put('/creator/settings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Obter dados do dashboard
  async getDashboard() {
    const response = await api.get('/creator/dashboard');
    return response.data;
  }
}

export default new CreatorService();