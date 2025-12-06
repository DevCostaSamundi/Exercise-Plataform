// src/services/authAPI.js
import api from './api';

class AuthAPI {
  // Login
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  }

  // Register
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  }

  // Creator Register
  async creatorRegister(data) {
    const response = await api.post('/auth/creator-register', data);
    return response.data;
  }

  // Logout
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  }

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  }

  // Verify email
  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  }

  // Request password reset
  async requestPasswordReset(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }

  // Refresh token
  async refreshToken() {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  }
}

export default new AuthAPI();