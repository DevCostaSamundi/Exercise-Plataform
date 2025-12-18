import api from './api';

class FavoriteService {
  /**
   * Listar favoritos do usuário
   */
  async getFavorites(params = {}) {
    const response = await api.get('/favorites', { params });
    return response.data;
  }

  /**
   * Adicionar criador aos favoritos
   */
  async addFavorite(creatorId) {
    const response = await api.post(`/favorites/${creatorId}`);
    return response.data;
  }

  /**
   * Remover criador dos favoritos
   */
  async removeFavorite(creatorId) {
    const response = await api.delete(`/favorites/${creatorId}`);
    return response.data;
  }

  /**
   * Verificar se criador está nos favoritos
   */
  async checkFavorite(creatorId) {
    const response = await api.get(`/favorites/check/${creatorId}`);
    return response.data;
  }

  /**
   * Toggle favorite (adicionar ou remover)
   */
  async toggleFavorite(creatorId) {
    try {
      const check = await this.checkFavorite(creatorId);
      
      if (check.isFavorited) {
        return await this.removeFavorite(creatorId);
      } else {
        return await this.addFavorite(creatorId);
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new FavoriteService();