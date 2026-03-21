/**
 * NotificationContext — usa window.__app_socket__ via SocketService.
 * NÃO cria io() próprio. Partilha o singleton com SocketContext.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { connectSocket, getSocket } from '../services/SocketService';
import { getAuthToken } from '../services/api';
import api from '../services/api';
import PropTypes from 'prop-types';

const NotificationContext = createContext();

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const [connected, setConnected]         = useState(() => !!getSocket()?.connected);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const token = getAuthToken();
    if (!token) return;

    initialized.current = true;

    // Reutiliza o singleton — connectSocket é idempotente
    const s = connectSocket(token);
    if (!s) return;

    setConnected(s.connected);

    const onConnect    = ()      => setConnected(true);
    const onDisconnect = ()      => setConnected(false);
    const onNew        = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      showBrowserNotification(notif);
    };

    s.on('connect',          onConnect);
    s.on('disconnect',       onDisconnect);
    s.on('notification:new', onNew);

    return () => {
      s.off('connect',          onConnect);
      s.off('disconnect',       onDisconnect);
      s.off('notification:new', onNew);
      initialized.current = false;
    };
  }, []);

  const fetchNotifications = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.unread) params.append('unread', 'true');
      if (filters.page)   params.append('page',   filters.page);
      if (filters.limit)  params.append('limit',  filters.limit);
      const res = await api.get(`/notifications?${params.toString()}`);
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
      return res.data.data;
    } catch (err) {
      console.error('[Notifications] Erro:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: false } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAsUnread = useCallback(async (id) => {
    await api.patch(`/notifications/${id}/unread`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: true } : n));
    setUnreadCount((prev) => prev + 1);
  }, []);

  const markAllAsRead = useCallback(async () => {
    await api.patch('/notifications/mark-all-read');
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id) => {
    const wasUnread = notifications.find((n) => n.id === id)?.unread;
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [notifications]);

  const bulkDelete = useCallback(async (ids) => {
    const unreadDeleted = notifications.filter((n) => ids.includes(n.id) && n.unread).length;
    await api.delete('/notifications/bulk-delete', { data: { ids } });
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    setUnreadCount((prev) => Math.max(0, prev - unreadDeleted));
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading, connected,
      fetchNotifications, markAsRead, markAsUnread,
      markAllAsRead, deleteNotification, bulkDelete,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = { children: PropTypes.node.isRequired };

function showBrowserNotification(notification) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message, icon: '/logo.png',
      badge: '/logo.png', tag: notification.id,
    });
  }
}

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return Notification.permission === 'granted';
};