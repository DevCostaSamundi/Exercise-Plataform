// hooks/useMessageSocket.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { getAuthToken } from '../services/api';

export const useMessageSocket = (user) => { // ✅ Receber user object ao invés de userId
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessage, setNewMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    // ✅ CORRIGIR: Extrair userId de user. id ou user.userId
    const userId = user?.id || user?.userId;

    if (!userId) {
      console.warn('⚠️ useMessageSocket:  No userId or id provided');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      console.error('❌ useMessageSocket: No auth token found');
      return;
    }

    console.log('🔌 Attempting to connect socket for user:', userId);

    // Conectar ao namespace /messages
    const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(`${url}/messages`, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Event listeners
    newSocket.on('connect', () => {
      console.log('✅ Connected to messages namespace:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('join', userId);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connect_error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from messages:', reason);
      setIsConnected(false);
    });

    // Nova mensagem recebida
    newSocket.on('new_message', (message) => {
      console.log('📨 New message received:', message);
      setNewMessage(message);
    });

    // Mensagem enviada com sucesso
    newSocket.on('message_sent', (message) => {
      console.log('✅ Message sent:', message);
      setNewMessage(message);
    });

    // Usuário digitando
    newSocket.on('user_typing', ({ conversationId, userId: typingUserId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: isTyping ? typingUserId : null
      }));
    });

    // Erro
    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.off('connect');
      newSocket.off('connect_error');
      newSocket.off('disconnect');
      newSocket.off('new_message');
      newSocket.off('message_sent');
      newSocket.off('user_typing');
      newSocket.off('error');
      newSocket.close();
    };
  }, [user?.id, user?.userId]); // ✅ Dependências corretas

  const sendMessage = useCallback((data) => {
    if (!socketRef.current) {
      console.error('❌ Cannot send message: Socket not initialized');
      return;
    }

    if (!isConnected) {
      console.error('❌ Cannot send message:  Socket not connected');
      return;
    }

    console.log('📤 Sending message:', data);
    socketRef.current.emit('send_message', data);
  }, [isConnected]);

  const startTyping = useCallback((conversationId, recipientId) => {
    const userId = user?.id || user?.userId; // ✅ Extrair userId
    if (socketRef.current && isConnected && userId) {
      socketRef.current.emit('typing_start', {
        conversationId,
        userId,
        recipientId
      });
    }
  }, [isConnected, user]);

  const stopTyping = useCallback((conversationId, recipientId) => {
    const userId = user?.id || user?.userId; // ✅ Extrair userId
    if (socketRef.current && isConnected && userId) {
      socketRef.current.emit('typing_stop', {
        conversationId,
        userId,
        recipientId
      });
    }
  }, [isConnected, user]);

  const markAsRead = useCallback((messageIds) => {
    const userId = user?.id || user?.userId; // ✅ Extrair userId
    if (socketRef.current && isConnected && userId) {
      socketRef.current.emit('mark_as_read', {
        messageIds,
        userId
      });
    }
  }, [isConnected, user]);

  return {
    socket,
    isConnected,
    newMessage,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    setNewMessage,
  };
};