/**
 * Context para gerenciar conexão Socket.io
 * Provides real-time functionality para mensagens e notificações
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Inicializar socket quando usuário estiver autenticado
  useEffect(() => {
    if (!user?._id) {
      // Se não há usuário, desconectar
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Criar nova conexão
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('pride_connect_token'),
        userId: user._id,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Event listeners
    newSocket.on('connect', () => {
      console.log('✅ Socket conectado:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console. log('❌ Socket desconectado:', reason);
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

    setSocket(newSocket);

    // Cleanup ao desmontar
    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);

  // Emitir evento de "digitando"
  const emitTyping = useCallback((recipientId) => {
    if (socket && isConnected) {
      socket.emit('typing', { recipientId });
    }
  }, [socket, isConnected]);

  // Parar de "digitando"
  const emitStopTyping = useCallback((recipientId) => {
    if (socket && isConnected) {
      socket.emit('stop_typing', { recipientId });
    }
  }, [socket, isConnected]);

  // Marcar mensagem como lida
  const emitMessageRead = useCallback((messageId, senderId) => {
    if (socket && isConnected) {
      socket.emit('message_read', { messageId, senderId });
    }
  }, [socket, isConnected]);

  // Entrar em sala de chat
  const joinChatRoom = useCallback((userId) => {
    if (socket && isConnected) {
      socket.emit('join_chat', { userId });
    }
  }, [socket, isConnected]);

  // Sair de sala de chat
  const leaveChatRoom = useCallback((userId) => {
    if (socket && isConnected) {
      socket.emit('leave_chat', { userId });
    }
  }, [socket, isConnected]);

  // Verificar se usuário está online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    isUserOnline,
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