import axios from 'axios';


// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies (refresh tokens)
});

// Request interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token (works with both localStorage and cookie)
        // The backend will check both req.body.refreshToken and req.cookies.refreshToken
        const refreshToken = localStorage.getItem('refreshToken');
        const refreshPayload = refreshToken ? { refreshToken } : {};
        
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
          refreshPayload,
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;
        
        // Store new access token
        localStorage.setItem('accessToken', accessToken);

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Dispatch custom event for navigation handling
        // This allows React components to handle navigation properly
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  register: (userData) => api.post('/auth/v1/register', userData),
  login: (credentials) => api.post('/auth/v1/login', credentials),
  logout: () => api.post('/auth/v1/logout'),
  refresh: (refreshToken) => api.post('/auth/v1/refresh', { refreshToken }),
  getMe: () => api.get('/auth/v1/me'),
  forgotPassword: (email) => api.post('/auth/v1/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

export const creatorsAPI = {
  getAll: (params) => api.get('/creators', { params }),
  getById: (id) => api.get(`/creators/${id}`),
  create: (creatorData) => api.post('/creators', creatorData),
  update: (id, creatorData) => api.put(`/creators/${id}`, creatorData),
  getStats: (id) => api.get(`/creators/${id}/stats`),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
};

export const postsAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getById: (id) => api.get(`/posts/${id}`),
  create: (postData) => api.post('/posts', postData),
  update: (id, postData) => api.put(`/posts/${id}`, postData),
  delete: (id) => api.delete(`/posts/${id}`),
};

export const uploadsAPI = {
  getPresignedUrl: (fileData) => api.post('/uploads/presign', fileData),
};

export const checkoutAPI = {
  createSession: (checkoutData) => api.post('/checkout/create-session', checkoutData),
};

export default api;
