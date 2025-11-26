import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/SocketService';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { token, user } = useAuth();
  const [chats, setChats] = useState({}); // { chatId: { messages:[], loading:false, meta:{} } }
  const socketRef = useRef(null);

  useEffect(() => {
    if (token) {
      socketRef.current = connectSocket(token);
      const s = socketRef.current;

      s.on('chat:message', (message) => {
        setChats(prev => {
          const chat = prev[message.chatId] || { messages: [] };
          return { ...prev, [message.chatId]: { ...chat, messages: [...chat.messages, message] } };
        });
      });

      s.on('live:message', (message) => {
        // handle live messages globally or forward to relevant live chat component via event emitter
        // Example: store under chats[`live-${message.liveId}`]
        setChats(prev => {
          const key = `live-${message.liveId}`;
          const chat = prev[key] || { messages: [] };
          return { ...prev, [key]: { ...chat, messages: [...chat.messages, message] } };
        });
      });

      s.on('moderation:deleted', ({ chatId, messageId }) => {
        setChats(prev => {
          const chat = prev[chatId];
          if (!chat) return prev;
          return {
            ...prev,
            [chatId]: { ...chat, messages: chat.messages.filter(m => m.id !== messageId) }
          };
        });
      });

      return () => {
        disconnectSocket();
      };
    } else {
      disconnectSocket();
    }
  }, [token]);

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
    // optimistic UI
    const tempId = `temp-${Date.now()}`;
    const tempMessage = { id: tempId, chatId, fromUserId: user.id, text: content, type, meta, pending: true, createdAt: new Date().toISOString() };
    setChats(prev => {
      const chat = prev[chatId] || { messages: [] };
      return { ...prev, [chatId]: { ...chat, messages: [...chat.messages, tempMessage] } };
    });

    try {
      // emit via socket for realtime
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('chat:message', { chatId, type, content, meta }, (err, savedMessage) => {
          if (err) {
            // mark failed
            setChats(prev => {
              const chat = prev[chatId];
              return { ...prev, [chatId]: { ...chat, messages: chat.messages.map(m => m.id === tempId ? { ...m, error:true, pending:false } : m) } };
            });
          } else {
            // replace temp message with savedMessage
            setChats(prev => {
              const chat = prev[chatId];
              return { ...prev, [chatId]: { ...chat, messages: chat.messages.map(m => m.id === tempId ? savedMessage : m) } };
            });
          }
        });
      } else {
        // fallback to REST save and rely on server for broadcast
        const saved = await api.post('/api/v1/messages', { chatId, type, content, meta });
        setChats(prev => {
          const chat = prev[chatId];
          return { ...prev, [chatId]: { ...chat, messages: chat.messages.map(m => m.id === tempId ? saved : m) } };
        });
      }
    } catch (err) {
      setChats(prev => {
        const chat = prev[chatId];
        return { ...prev, [chatId]: { ...chat, messages: chat.messages.map(m => m.id === tempId ? { ...m, error:true, pending:false } : m) } };
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