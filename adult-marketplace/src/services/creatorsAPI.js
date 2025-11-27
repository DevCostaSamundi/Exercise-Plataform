import api from './api';

const creatorsAPI = {
  getAll: async (params = {}) => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 12,
      ...(params.category && { category: params.category }),
      ...(params.search && { search: params.search }),
    };
    return api.get('/creators', { params: queryParams });
  },

  getById: async (id) => {
    return api.get(`/creators/${id}`);
  },

  getFeatured: async () => {
    return api.get('/creators/featured');
  },
};

export default creatorsAPI;
