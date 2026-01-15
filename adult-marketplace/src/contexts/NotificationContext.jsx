import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api, { getAuthToken } from '../services/api';
import PropTypes from 'prop-types';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // Inicializar WebSocket
  useEffect(() => {
    const token = getAuthToken();
    if (! token) {
      console.log('No token found, skipping WebSocket connection');
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to notification server');
      setConnected(true);
    });

    newSocket.on('connected', (data) => {
      console. log('🔔 Notification server ready:', data);
    });

    newSocket.on('notification: new', (notification) => {
      console.log('🔔 New notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Mostrar notificação do navegador (se permitido)
      showBrowserNotification(notification);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from notification server:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error. message);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket. disconnect();
    };
  }, []);

  // Carregar notificações
  const fetchNotifications = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters. type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.unread) params.append('unread', 'true');
      if (filters.page) params.append('page', filters. page);
      if (filters. limit) params.append('limit', filters.limit);

      const response = await api.get(`/notifications?${params.toString()}`);
      
      setNotifications(response.data.data. notifications);
      setUnreadCount(response.data.data.unreadCount);
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar como lida
  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, []);

  // Marcar como não lida
  const markAsUnread = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/unread`);
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: true } : n))
      );
      setUnreadCount((prev) => prev + 1);
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      throw error;
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }, []);

  // Deletar notificação
  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      
      const wasUnread = notifications.find((n) => n.id === id)?.unread;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }, [notifications]);

  // Deletar múltiplas
  const bulkDelete = useCallback(async (ids) => {
    try {
      await api.delete('/notifications/bulk-delete', { data: { ids } });
      
      const unreadDeleted = notifications.filter(
        (n) => ids.includes(n.id) && n.unread
      ).length;
      
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setUnreadCount((prev) => Math.max(0, prev - unreadDeleted));
    } catch (error) {
      console.error('Error bulk deleting notifications:', error);
      throw error;
    }
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    connected,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    bulkDelete,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node. isRequired,
};

// Helper:  Notificação do navegador
function showBrowserNotification(notification) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: notification.id,
    });
  }
}

// Solicitar permissão de notificações
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification. permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
};