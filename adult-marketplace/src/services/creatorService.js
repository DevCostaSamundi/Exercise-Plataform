const API_URL = 'http://localhost:5000/api/v1';

class CreatorService {
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Obter perfil do criador
  async getCreatorProfile(creatorId) {
    const response = await fetch(`${API_URL}/creators/${creatorId}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch creator profile');
    }

    return response.json();
  }

  // Obter posts do criador
  async getCreatorPosts(creatorId, params = {}) {
    const queryParams = new URLSearchParams(params);
    
    const response = await fetch(
      `${API_URL}/creators/${creatorId}/posts?${queryParams.toString()}`,
      {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return response.json();
  }

  // Listar criadores
  async listCreators(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    
    const response = await fetch(
      `${API_URL}/creators?${queryParams.toString()}`,
      {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch creators');
    }

    return response.json();
  }
}

export default new CreatorService();