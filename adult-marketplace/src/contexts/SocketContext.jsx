/**
 * SocketContext — wrapper React sobre o SocketService singleton.
 * O socket vive em window.__app_socket__ e sobrevive a HMR e re-renders.
 * NUNCA chama disconnect() em cleanup — só no logout.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/SocketService';
import { getAuthToken } from '../services/api';

const SocketContext = createContext(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};

export const useSocketContext = useSocket;

export const SocketProvider = ({ children, user }) => {
  const [isConnected, setIsConnected] = useState(() => !!getSocket()?.connected);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const initialized = useRef(false);

  useEffect(() => {
    // Já inicializado — apenas sincronizar estado
    if (initialized.current) {
      const s = getSocket();
      if (s) setIsConnected(s.connected);
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    initialized.current = true;

    // Idempotente — devolve singleton existente se já ligado
    const s = connectSocket(token);
    if (!s) return;

    setIsConnected(s.connected);

    const onConnect     = ()     => setIsConnected(true);
    const onDisconnect  = ()     => setIsConnected(false);
    const onOnlineUsers = (list) => setOnlineUsers(list);

    s.on('connect',      onConnect);
    s.on('disconnect',   onDisconnect);
    s.on('online_users', onOnlineUsers);

    // Apenas remover listeners — NUNCA disconnect()
    return () => {
      s.off('connect',      onConnect);
      s.off('disconnect',   onDisconnect);
      s.off('online_users', onOnlineUsers);
      initialized.current = false;
    };
  }, []); // [] = só no mount

  // Quando user faz login depois do mount
  useEffect(() => {
    if (!user?._id) return;
    const s = getSocket();
    if (!s || (!s.connected && !s.active)) {
      const token = getAuthToken();
      if (token) connectSocket(token);
    }
  }, [user?._id]);

  const emit = useCallback((event, data) => {
    const s = getSocket();
    if (s?.connected) {
      s.emit(event, data);
    } else if (import.meta.env.DEV) {
      console.warn('[Socket] emit ignorado — não ligado:', event);
    }
  }, []);

  const emitTyping      = useCallback((id)       => emit('typing',       { recipientId: id }),              [emit]);
  const emitStopTyping  = useCallback((id)       => emit('stop_typing',  { recipientId: id }),              [emit]);
  const emitMessageRead = useCallback((mid, sid) => emit('message_read', { messageId: mid, senderId: sid }),[emit]);
  const joinChatRoom    = useCallback((id)       => emit('join_chat',    { userId: id }),                   [emit]);
  const leaveChatRoom   = useCallback((id)       => emit('leave_chat',   { userId: id }),                   [emit]);
  const isUserOnline    = useCallback((id)       => onlineUsers.includes(id),                               [onlineUsers]);

  const connect    = useCallback(() => { const t = getAuthToken(); if (t) connectSocket(t); }, []);
  const disconnect = useCallback(() => { disconnectSocket(); setIsConnected(false); }, []);

  return (
    <SocketContext.Provider value={{
      socket: getSocket(),
      isConnected, onlineUsers, isUserOnline,
      connect, disconnect, emit,
      emitTyping, emitStopTyping, emitMessageRead,
      joinChatRoom, leaveChatRoom,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;