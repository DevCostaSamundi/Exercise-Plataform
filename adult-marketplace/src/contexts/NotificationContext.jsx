/**
 * Context para gerenciar notificações
 * Handles notificações in-app e real-time via Socket.io
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import notificationService from '../services/notificationService';

const NotificationContext = createContext(null);

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
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const { socket, isConnected } = useSocket();

  // Buscar notificações iniciais
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      
      const response = await notificationService.getNotifications({
        page: pageNum,
        limit: 20,
      });

      const { notifications: newNotifications, hasMore: more, unreadCount: count } = response;

      if (append) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }

      setUnreadCount(count);
      setHasMore(more);
      setPage(pageNum);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar notificações na montagem
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Escutar novas notificações via Socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification) => {
      // Adicionar notificação no topo
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Tocar som (opcional)
      playNotificationSound();

      // Mostrar notificação do navegador (se permitido)
      showBrowserNotification(notification);
    };

    // Listen to both event names for compatibility
    socket.on('notification', handleNewNotification);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, isConnected]);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, []);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);

      // Remover do estado
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }, []);

  // Carregar mais notificações
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  }, [loading, hasMore, page, fetchNotifications]);

  // Tocar som de notificação
  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => {
      // Ignorar erro se usuário não permitiu autoplay
      console.log('Autoplay bloqueado:', err);
    });
  };

  // Mostrar notificação do navegador
  const showBrowserNotification = (notification) => {
    if (! ('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification('PrideConnect', {
        body: notification.message,
        icon: '/logo.png',
        badge: '/badge.png',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showBrowserNotification(notification);
        }
      });
    }
  };

  // Solicitar permissão para notificações
  const requestNotificationPermission = useCallback(async () => {
    if (! ('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    requestNotificationPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;