import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { connectSocket, getSocket } from '../services/SocketService';
import api from '../services/api';
import { getAuthToken } from '../services/api';
import { useAuth } from './AuthContext';

// ⚠️ disconnectSocket removido dos imports — nunca chamar no cleanup

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [chats, setChats] = useState({});
  const listenersRef = useRef(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // Idempotente — devolve singleton existente
    const s = connectSocket(token);
    if (!s) return;

    // Evitar registar listeners duplicados
    if (listenersRef.current) return;
    listenersRef.current = true;

    const onChatMessage = (message) => {
      setChats(prev => {
        const chat = prev[message.chatId] || { messages: [] };
        return { ...prev, [message.chatId]: { ...chat, messages: [...chat.messages, message] } };
      });
    };

    const onLiveMessage = (message) => {
      setChats(prev => {
        const key = `live-${message.liveId}`;
        const chat = prev[key] || { messages: [] };
        return { ...prev, [key]: { ...chat, messages: [...chat.messages, message] } };
      });
    };

    const onModerationDeleted = ({ chatId, messageId }) => {
      setChats(prev => {
        const chat = prev[chatId];
        if (!chat) return prev;
        return {
          ...prev,
          [chatId]: { ...chat, messages: chat.messages.filter(m => m.id !== messageId) }
        };
      });
    };

    s.on('chat:message',        onChatMessage);
    s.on('live:message',        onLiveMessage);
    s.on('moderation:deleted',  onModerationDeleted);

    // ⚠️ Apenas .off() — NUNCA disconnectSocket() aqui
    return () => {
      s.off('chat:message',       onChatMessage);
      s.off('live:message',       onLiveMessage);
      s.off('moderation:deleted', onModerationDeleted);
      listenersRef.current = false;
    };
  }, [user?._id]); // re-registar listeners quando user muda (ex: logout/login)

  async function loadChatHistory(chatId, page = 1, limit = 50) {
    setChats(prev => ({ ...prev, [chatId]: { ...(prev[chatId] || {}), loading: true } }));
    try {
      const res = await api.get(`/api/v1/chats/${chatId}/messages?page=${page}&limit=${limit}`);
      setChats(prev => ({ ...prev, [chatId]: { ...prev[chatId], messages: res.items || [], loading: false } }));
      return res;
    } catch (err) {
      setChats(prev => ({ ...prev, [chatId]: { ...prev[chatId], loading: false } }));
      throw err;
    }
  }

  async function sendMessage(chatId, content, type = 'text', meta = {}) {
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId, chatId,
      fromUserId: user?.id,
      text: content, type, meta,
      pending: true,
      createdAt: new Date().toISOString(),
    };

    setChats(prev => {
      const chat = prev[chatId] || { messages: [] };
      return { ...prev, [chatId]: { ...chat, messages: [...chat.messages, tempMessage] } };
    });

    try {
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('chat:message', { chatId, type, content, meta }, (err, savedMessage) => {
          if (err) {
            setChats(prev => {
              const chat = prev[chatId];
              return { ...prev, [chatId]: { ...chat, messages: chat.messages.map(m => m.id === tempId ? { ...m, error: true, pending: false } : m) } };
            });
          } else {
            setChats(prev => {
              const chat = prev[chatId];
              return { ...prev, [chatId]: { ...chat, messages: chat.messages.map(m => m.id === tempId ? savedMessage : m) } };
            });
          }
        });
      } else {
        const saved = await api.post('/api/v1/messages', { chatId, type, content, meta });
        setChats(prev => {
          const chat = prev[chatId];
          return { ...prev, [chatId]: { ...chat, messages: chat.messages.map(m => m.id === tempId ? saved : m) } };
        });
      }
    } catch (err) {
      setChats(prev => {
        const chat = prev[chatId];
        return { ...prev, [chatId]: { ...chat, messages: chat.messages.map(m => m.id === tempId ? { ...m, error: true, pending: false } : m) } };
      });
      throw err;
    }
  }

  return (
    <ChatContext.Provider value={{ chats, loadChatHistory, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}