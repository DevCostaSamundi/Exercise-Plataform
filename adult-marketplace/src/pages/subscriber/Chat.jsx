/**
 * Chat Individual
 * Conversa com um criador
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { formatTimeOnly } from '../../utils/formatters';
import {
  FiSend,
  FiImage,
  FiLock,
  FiArrowLeft,
  FiMoreVertical,
} from 'react-icons/fi';
import PPVModal from '../../components/subscriber/PPVModal';
import PPVMessageModal from '../../components/subscriber/PPVMessageModal';
import api from '../../services/api';

const Chat = () => {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPPVModal, setShowPPVModal] = useState(false);
  const [selectedPPV, setSelectedPPV] = useState(null);
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    socket,
    isConnected,
    isUserOnline,
    emitTyping,
    emitStopTyping,
    joinChatRoom,
    leaveChatRoom,
  } = useSocket();

  useEffect(() => {
    fetchChat();
    if (joinChatRoom) joinChatRoom(userId);

    return () => {
      if (leaveChatRoom) leaveChatRoom(userId);
    };
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (message) => {
      if (message.senderId === userId || message.recipientId === userId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTyping = ({ senderId }) => {
      if (senderId === userId) {
        setTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId === userId) {
        setTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, isConnected, userId]);

  const fetchChat = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/${userId}`);

      setCreator(response.data.user);
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Erro ao buscar chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (emitTyping) {
      emitTyping(userId);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (emitStopTyping) {
        emitStopTyping(userId);
      }
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    try {
      setSending(true);

      const formData = new FormData();
      formData.append('recipientId', userId);
      if (newMessage.trim()) {
        formData.append('text', newMessage);
      }
      if (selectedImage) {
        formData.append('media', selectedImage);
      }

      const response = await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessages((prev) => [...prev, response.data.message]);
      setNewMessage('');
      setSelectedImage(null);

      if (emitStopTyping) {
        emitStopTyping(userId);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleUnlockPPV = async (paymentData) => {
    try {
      await api.post(`/messages/${selectedPPV._id}/unlock`, paymentData);

      // Update message
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === selectedPPV._id ? { ...msg, isUnlocked: true } : msg
        )
      );

      setShowPPVModal(false);
      setSelectedPPV(null);
    } catch (err) {
      console.error('Erro ao desbloquear:', err);
      throw err;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isOnline = isUserOnline(userId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              to="/messages"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
            >
              <FiArrowLeft />
            </Link>

            <Link to={`/creator/${creator?.username}`} className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={creator?.avatar || '/default-avatar.png'}
                  alt={creator?.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {creator?.name}
                  {creator?.isVerified && (
                    <span className="ml-1 text-blue-500">✓</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </Link>
          </div>

          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <FiMoreVertical />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isMine = message.isMine;
            const isPPV = message.isPPV && !message.isUnlocked;

            return (
              <div
                key={message._id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    isMine
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                  } rounded-lg p-3 shadow-sm`}
                >
                  {isPPV ? (
                    <div className="flex flex-col items-center gap-2 p-4">
                      <FiLock className="text-3xl text-yellow-600" />
                      <p className="font-semibold">Mensagem Bloqueada</p>
                      <p className="text-sm">R$ {message.price?.toFixed(2)}</p>
                      <button
                        onClick={() => {
                          setSelectedPPV(message);
                          setShowPPVModal(true);
                        }}
                        className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold"
                      >
                        Desbloquear
                      </button>
                    </div>
                  ) : (
                    <>
                      {message.media && (
                        <img
                          src={message.media.url}
                          alt="Media"
                          className="rounded-lg mb-2 max-w-full"
                        />
                      )}
                      {message.text && (
                        <p className="whitespace-pre-wrap break-words">
                          {message.text}
                        </p>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          isMine ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatTimeOnly(message.createdAt)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
        <form
          onSubmit={handleSendMessage}
          className="flex items-end gap-2 max-w-4xl mx-auto"
        >
          {selectedImage && (
            <div className="absolute bottom-20 left-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Preview"
                className="w-20 h-20 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiImage className="text-xl text-gray-600 dark:text-gray-400" />
          </button>

          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Escreva uma mensagem..."
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && !selectedImage)}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="text-xl" />
          </button>
        </form>
      </div>

      {/* PPV Modal */}
      {showPPVModal && selectedPPV && (
        <PPVMessageModal
          message={selectedPPV}
          creator={creator}
          onClose={() => {
            setShowPPVModal(false);
            setSelectedPPV(null);
          }}
          onUnlock={handleUnlockPPV}
        />
      )}
    </div>
  );
};

export default Chat;