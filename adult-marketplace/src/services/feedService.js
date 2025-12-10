import api from './api';

class FeedService {
  // Obter feed personalizado
  async getFeed(params = {}) {
    const response = await api.get('/posts/feed', { params });
    return response.data;
  }

  // Obter post específico
  async getPost(postId) {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  }

  // Curtir/descurtir post
  async likePost(postId) {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  }

  // Comentar em post
  async commentPost(postId, data) {
    const response = await api.post(`/posts/${postId}/comments`, data);
    return response.data;
  }

  // Obter comentários de um post
  async getComments(postId, params = {}) {
    const response = await api.get(`/posts/${postId}/comments`, { params });
    return response.data;
  }

  // Deletar comentário
  async deleteComment(commentId) {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  }

  // Obter posts trending
  async getTrendingPosts(params = {}) {
    const response = await api.get('/posts/trending', { params });
    return response.data;
  }
}

export default new FeedService();