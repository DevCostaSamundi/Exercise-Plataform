import axios from 'axios';
import { API, API_BASE_URL } from '../config/constants';

/**
 * Axios instance - SIMPLIFIED for Web3
 * No auth tokens, no login interceptors
 * Backend only for off-chain data (if needed)
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Log only
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;
