import api from './api';

class TrendingService {
  /**
   * Obter posts em trending
   */
  async getTrendingPosts(params = {}) {
    const response = await api.get('/trending/posts', { params });
    return response.data;
  }

  /**
   * Obter criadores em trending
   */
  async getTrendingCreators(params = {}) {
    const response = await api.get('/trending/creators', { params });
    return response.data;
  }

  /**
   * Obter tags em trending
   */
  async getTrendingTags(params = {}) {
    const response = await api.get('/trending/tags', { params });
    return response.data;
  }
}

export default new TrendingService();