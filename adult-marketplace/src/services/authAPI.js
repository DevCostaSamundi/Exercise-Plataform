// src/services/authAPI.js
import api from './api';

const authAPI = {
  login: async (credentials) => {
    return api.post('/auth/v1/login', credentials);
  },

  register: async (userData) => {
    return api.post('/auth/v1/register', userData);
  },

  creatorRegister: async (formData) => {
    return api.post('/auth/v1/creator-register', formData);
  },

  logout: async () => {
    return api.post('/auth/v1/logout');
  },

  getMe: async () => {
    return api.get('/auth/v1/me');
  },
};

export default authAPI;