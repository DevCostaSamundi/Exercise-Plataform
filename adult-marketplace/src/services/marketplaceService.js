// services/marketplaceService.js
import api from './api';

const marketplaceService = {

  // ── Pública ──────────────────────────────────────────────

  /** Explorar marketplace global */
  explore: (params = {}) =>
    api.get('/marketplace/explore', { params }).then(r => r.data),

  /** Loja pública de uma criadora */
  getCreatorStore: (creatorId, params = {}) =>
    api.get(`/marketplace/store/${creatorId}`, { params }).then(r => r.data),

  /** Detalhe de produto */
  getProduct: (productId) =>
    api.get(`/marketplace/product/${productId}`).then(r => r.data),

  /** Avaliar produto */
  createReview: (productId, data) =>
    api.post(`/marketplace/products/${productId}/reviews`, data).then(r => r.data),

  // ── Criadora ─────────────────────────────────────────────

  /** Listar os meus produtos */
  getMyProducts: (params = {}) =>
    api.get('/marketplace/creator/products', { params }).then(r => r.data),

  /** Criar produto */
  createProduct: (data) =>
    api.post('/marketplace/creator/products', data).then(r => r.data),

  /** Editar produto */
  updateProduct: (productId, data) =>
    api.put(`/marketplace/creator/products/${productId}`, data).then(r => r.data),

  /** Remover produto */
  deleteProduct: (productId) =>
    api.delete(`/marketplace/creator/products/${productId}`).then(r => r.data),

  /** Perfil da loja */
  getMyStoreProfile: () =>
    api.get('/marketplace/creator/store-profile').then(r => r.data),

  updateMyStoreProfile: (data) =>
    api.put('/marketplace/creator/store-profile', data).then(r => r.data),

  /** Avaliações recebidas */
  getMyReviews: (params = {}) =>
    api.get('/marketplace/creator/reviews', { params }).then(r => r.data),
};

export default marketplaceService;