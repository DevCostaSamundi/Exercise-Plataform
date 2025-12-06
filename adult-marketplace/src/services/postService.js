import api from './api';

class PostService {
  // Listar posts públicos
  async listPosts(params = {}) {
    const response = await api.get('/posts', { params });
    return response.data;
  }

  // Obter post específico
  async getPost(postId) {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  }

  // Curtir post
  async likePost(postId) {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  }

  // Descurtir post
  async unlikePost(postId) {
    const response = await api.delete(`/posts/${postId}/like`);
    return response.data;
  }

  // Adicionar comentário
  async addComment(postId, content) {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  }

  // Listar comentários
  async getComments(postId, params = {}) {
    const response = await api.get(`/posts/${postId}/comments`, { params });
    return response.data;
  }

  // Deletar comentário
  async deleteComment(postId, commentId) {
    const response = await api.delete(`/posts/${postId}/comments/${commentId}`);
    return response.data;
  }

  // Denunciar post
  async reportPost(postId, reason) {
    const response = await api.post(`/posts/${postId}/report`, { reason });
    return response.data;
  }
}

export default new PostService();