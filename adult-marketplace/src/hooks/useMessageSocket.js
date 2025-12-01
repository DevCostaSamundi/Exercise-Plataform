import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useMessageSocket = (userId) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessage, setNewMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (! userId) return;

    // Conectar ao namespace de mensagens
    socketRef.current = io(`${SOCKET_URL}/messages`, {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('authToken'),
      },
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Socket conectado');
      setIsConnected(true);
      socket.emit('join', userId);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
      setIsConnected(false);
    });

    socket.on('new_message', (message) => {
      console.log('📨 Nova mensagem recebida:', message);
      setNewMessage(message);
    });

    socket.on('user_typing', ({ conversationId, userId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: isTyping ?  userId : null,
      }));
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const sendMessage = (data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', data);
    }
  };

  const startTyping = (conversationId, recipientId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_start', {
        conversationId,
        userId,
        recipientId,
      });
    }
  };

  const stopTyping = (conversationId, recipientId) => {
    if (socketRef. current && isConnected) {
      socketRef.current.emit('typing_stop', {
        conversationId,
        userId,
        recipientId,
      });
    }
  };

  return {
    isConnected,
    newMessage,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    setNewMessage, // Para limpar a nova mensagem
  };
};