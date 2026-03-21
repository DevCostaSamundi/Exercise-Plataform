/**
 * SocketContext — wrapper React sobre o SocketService singleton.
 *
 * REGRAS FUNDAMENTAIS:
 * 1. O socket é criado UMA vez e persiste globalmente
 * 2. NUNCA chamar disconnect() no cleanup de useEffect
 * 3. React StrictMode faz double-mount — o singleton sobrevive a isso
 * 4. disconnectSocket() só deve ser chamado no logout
 */

import {
  createContext, useContext, useEffect,
  useState, useCallback,
} from 'react';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from '../services/SocketService';
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

  // ── Inicializar socket (sobrevive ao double-mount do StrictMode) ──
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // connectSocket é idempotente — devolve o existente se já ligado
    const s = connectSocket(token);
    if (!s) return;

    // Atualizar estado inicial
    setIsConnected(s.connected);

    const onConnect     = ()     => setIsConnected(true);
    const onDisconnect  = ()     => setIsConnected(false);
    const onOnlineUsers = (list) => setOnlineUsers(list);

    s.on('connect',      onConnect);
    s.on('disconnect',   onDisconnect);
    s.on('online_users', onOnlineUsers);

    // ⚠️ Apenas remover listeners no cleanup — NUNCA disconnect()
    return () => {
      s.off('connect',      onConnect);
      s.off('disconnect',   onDisconnect);
      s.off('online_users', onOnlineUsers);
    };
  }, []); // [] = corre só no mount real (o StrictMode faz unmount/remount mas o socket singleton persiste)

  // ── Ligar quando o user fizer login ──────────────────────────────
  useEffect(() => {
    if (!user?._id) return;
    const s = getSocket();
    // Se o socket não existe ou foi desligado, reconectar
    if (!s || s.disconnected) {
      const token = getAuthToken();
      if (token) connectSocket(token);
    }
  }, [user?._id]);

  // ── Helpers de emissão ───────────────────────────────────────────
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

  // Exposto para logout — chama disconnectSocket() do serviço
  const connect    = useCallback(() => { const t = getAuthToken(); if (t) connectSocket(t); }, []);
  const disconnect = useCallback(() => { disconnectSocket(); setIsConnected(false); }, []);

  const value = {
    socket: getSocket(),
    isConnected,
    onlineUsers,
    isUserOnline,
    connect,
    disconnect,
    emit,
    emitTyping,
    emitStopTyping,
    emitMessageRead,
    joinChatRoom,
    leaveChatRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;