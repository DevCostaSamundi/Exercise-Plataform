import api from './api';

class FavoriteService {
  // Listar favoritos
  async getFavorites(params = {}) {
    const response = await api.get('/favorites', { params });
    return response.data;
  }

  // Adicionar aos favoritos
  async addFavorite(creatorId) {
    const response = await api.post(`/favorites/${creatorId}`);
    return response. data;
  }

  // Remover dos favoritos
  async removeFavorite(creatorId) {
    const response = await api.delete(`/favorites/${creatorId}`);
    return response.data;
  }

  // Verificar se é favorito
  async checkFavorite(creatorId) {
    const response = await api. get(`/favorites/check/${creatorId}`);
    return response.data;
  }
}

export default new FavoriteService();