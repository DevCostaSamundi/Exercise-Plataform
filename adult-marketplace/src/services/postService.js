const API_URL = 'http://localhost:5000/api/v1';

class PostService {
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Buscar posts do criador
  async getCreatorPosts(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters. status);
    if (filters. limit) queryParams.append('limit', filters.limit);
    if (filters.offset) queryParams.append('offset', filters.offset);

    const response = await fetch(
      `${API_URL}/posts/my-posts?${queryParams.toString()}`,
      {
        headers: this.getAuthHeaders(),
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar posts');
    }

    return response.json();
  }

  // Buscar post específico
  async getPost(postId) {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (! response.ok) {
      throw new Error('Erro ao buscar post');
    }

    return response.json();
  }

  // Criar novo post
  async createPost(postData) {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar post');
    }

    return response.json();
  }

  // Atualizar post
  async updatePost(postId, postData) {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response. json();
      throw new Error(error.message || 'Erro ao atualizar post');
    }

    return response.json();
  }

  // Deletar post
  async deletePost(postId) {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao deletar post');
    }

    return response.json();
  }

  // Deletar múltiplos posts
  async deletePosts(postIds) {
    const response = await fetch(`${API_URL}/posts/bulk-delete`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ postIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error. message || 'Erro ao deletar posts');
    }

    return response.json();
  }

  // Toggle like
  async toggleLike(postId) {
    const response = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao curtir post');
    }

    return response.json();
  }

  // Incrementar view
  async incrementView(postId) {
    await fetch(`${API_URL}/posts/${postId}/view`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });
  }
}

export default new PostService();