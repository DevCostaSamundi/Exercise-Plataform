import axios from 'axios';
import { API, ERROR_MESSAGES } from '../config/constants';

// API Configuration with environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_VERSION = import.meta.env.VITE_API_VERSION || API.VERSION;
const ENABLE_LOGGING = import.meta.env.VITE_ENABLE_LOGGING === 'true';

/**
 * Get authentication token from localStorage with fallback support
 * Tries multiple storage keys for backward compatibility
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = () => {
  // Try multiple token keys in order of preference
  const tokenKeys = ['authToken', 'accessToken', 'pride_connect_token'];
  
  for (const key of tokenKeys) {
    const token = localStorage.getItem(key);
    if (token) {
      return token;
    }
  }
  
  return null;
};

// Create axios instance with robust configuration
const api = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
  timeout: API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add authentication token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development mode
    if (ENABLE_LOGGING) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
      });
    }
    
    return config;
  },
  (error) => {
    if (ENABLE_LOGGING) {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Log successful response in development mode
    if (ENABLE_LOGGING) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    // Log error in development mode
    if (ENABLE_LOGGING) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message || error.message,
      });
    }

    // Handle specific HTTP status codes
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401: {
          // Unauthorized - Clear auth data and redirect to login
          const tokenKeys = ['authToken', 'accessToken', 'pride_connect_token'];
          tokenKeys.forEach(key => localStorage.removeItem(key));
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userType');
          localStorage.removeItem('user');
          
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            // Preserve current location as redirect parameter
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
          }
          break;
        }
          
        case 403:
          // Forbidden - User doesn't have permission
          console.error('Access forbidden:', data?.message);
          break;
          
        case 404:
          // Not found
          console.error('Resource not found:', error.config?.url);
          break;
          
        case 500:
        case 502:
        case 503:
          // Server errors
          console.error('Server error:', data?.message || 'Internal server error');
          break;
          
        default:
          console.error('API Error:', data?.message || error.message);
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error: No response from server');
      error.message = ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      // Request setup error
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
