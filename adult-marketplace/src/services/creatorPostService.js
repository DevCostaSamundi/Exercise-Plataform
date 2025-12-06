import api from './api';

class CreatorPostService {
  // Obter meus posts
  async getMyPosts(params = {}) {
    const response = await api.get('/creator/posts', { params });
    return response.data;
  }

  // Criar post
  async createPost(formData) {
    const response = await api.post('/creator/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Atualizar post
  async updatePost(postId, formData) {
    const response = await api.put(`/creator/posts/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Deletar post
  async deletePost(postId) {
    const response = await api.delete(`/creator/posts/${postId}`);
    return response.data;
  }

  // Deletar múltiplos posts
  async bulkDeletePosts(postIds) {
    const response = await api.post('/creator/posts/bulk-delete', { postIds });
    return response.data;
  }
}

export default new CreatorPostService();
