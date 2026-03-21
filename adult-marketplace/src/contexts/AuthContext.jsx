import { createContext, useContext, useState, useEffect } from 'react';
import authAPI from '../services/authAPI';
import { disconnectSocket } from '../services/SocketService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('flow_connect_token') || localStorage.getItem('authToken');
    const storedUserType = localStorage.getItem('userType');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setUserType(storedUserType);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    localStorage.setItem('flow_connect_token', response.data.accessToken);
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('userType', response.data.user.userType);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    setUserType(response.data.user.userType);
    setIsAuthenticated(true);
    return response;
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    localStorage.setItem('flow_connect_token', response.data.accessToken);
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('userType', 'SUBSCRIBER');
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    setUserType('SUBSCRIBER');
    setIsAuthenticated(true);
    return response;
  };

  const creatorRegister = async (data) => {
    const response = await authAPI.creatorRegister(data);
    localStorage.setItem('flow_connect_token', response.data.accessToken);
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('userType', 'CREATOR');
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    setUserType('CREATOR');
    setIsAuthenticated(true);
    return response;
  };

  const logout = () => {
    // Fechar socket antes de limpar token
    disconnectSocket();
    localStorage.removeItem('flow_connect_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    setUser(null);
    setUserType(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{
      user, userType, loading, isAuthenticated,
      login, register, creatorRegister, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}