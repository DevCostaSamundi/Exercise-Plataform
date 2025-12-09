/**
 * Context para gerenciar conexão Socket.io
 * Provides real-time functionality para mensagens e notificações
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/SocketService';
import { getAuthToken } from '../services/api';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

// Alias for backward compatibility
export const useSocketContext = useSocket;

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Function to initialize socket connection
  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token found, cannot connect socket');
      return;
    }

    const newSocket = connectSocket(token);
    setSocket(newSocket);

    // Setup event listeners
    newSocket.on('connect', () => {
      console.log('✅ Socket conectado:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Erro de conexão socket:', error);
      setIsConnected(false);
    });

    // Receber lista de usuários online
    newSocket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    return newSocket;
  }, []);

  // Function to disconnect socket
  const disconnect = useCallback(() => {
    disconnectSocket();
    setSocket(null);
    setIsConnected(false);
  }, []);

  // Inicializar socket quando usuário estiver autenticado
  useEffect(() => {
    if (!user?._id) {
      // Se não há usuário, desconectar
      disconnect();
      return;
    }

    // Create connection
    const newSocket = connect();

    // Cleanup ao desmontar
    return () => {
      if (newSocket) {
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.off('online_users');
      }
    };
  }, [user?._id, connect, disconnect]);

  // Listen for auth token changes and reconnect
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Check if any auth token changed
      const authKeys = ['authToken', 'accessToken', 'pride_connect_token'];
      if (authKeys.includes(e.key)) {
        console.log('Auth token changed, reconnecting socket...');
        disconnect();
        if (e.newValue && user?._id) {
          // Token was added or changed, reconnect
          setTimeout(() => connect(), 100);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user?._id, connect, disconnect]);

  // Generic emit helper
  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Cannot emit, socket not connected');
    }
  }, [socket, isConnected]);

  // Emitir evento de "digitando"
  const emitTyping = useCallback((recipientId) => {
    emit('typing', { recipientId });
  }, [emit]);

  // Parar de "digitando"
  const emitStopTyping = useCallback((recipientId) => {
    emit('stop_typing', { recipientId });
  }, [emit]);

  // Marcar mensagem como lida
  const emitMessageRead = useCallback((messageId, senderId) => {
    emit('message_read', { messageId, senderId });
  }, [emit]);

  // Entrar em sala de chat
  const joinChatRoom = useCallback((userId) => {
    emit('join_chat', { userId });
  }, [emit]);

  // Sair de sala de chat
  const leaveChatRoom = useCallback((userId) => {
    emit('leave_chat', { userId });
  }, [emit]);

  // Verificar se usuário está online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  const value = {
    socket,
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