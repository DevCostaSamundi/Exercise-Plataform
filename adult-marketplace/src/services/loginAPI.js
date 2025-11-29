import api from './api';

const creatorsAPI = {
  getAll: async (params = {}) => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 12,
      ...(params.category && { category: params.category }),
      ...(params.search && { search: params.search }),
    };
    return api.get('/login', { params: queryParams });
  },

  getById: async (id) => {
    return api.get(`/login/${id}`);
  },

  getFeatured: async () => {
    return api.get('/login');
  },

  login: async (data) => {
    return api.post('/api/v1/auth/login', data);
  },
};



export default creatorsAPI;
