import api from './api';

class TrendingService {
  /**
   * Get trending posts
   * @param {Object} params - Query parameters (period, page, limit)
   * @returns {Promise<Object>} Trending posts data
   */
  async getTrendingPosts(params = {}) {
    const response = await api.get('/trending/posts', { params });
    return response.data;
  }

  /**
   * Get trending creators
   * @param {Object} params - Query parameters (period, page, limit)
   * @returns {Promise<Object>} Trending creators data
   */
  async getTrendingCreators(params = {}) {
    const response = await api.get('/trending/creators', { params });
    return response.data;
  }

  /**
   * Get trending tags/hashtags
   * @param {Object} params - Query parameters (period, limit)
   * @returns {Promise<Object>} Trending tags data
   */
  async getTrendingTags(params = {}) {
    const response = await api.get('/trending/tags', { params });
    return response.data;
  }
}

export default new TrendingService();
