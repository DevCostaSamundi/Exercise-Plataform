import api from './api';

const categoriesAPI = {
  getAll: async () => {
    return api.get('/categories');
  },

  getBySlug: async (slug) => {
    return api.get(`/categories/${slug}`);
  },
};

export default categoriesAPI;
