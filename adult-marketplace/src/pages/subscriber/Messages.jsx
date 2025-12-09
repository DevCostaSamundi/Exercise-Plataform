/**
 * Inbox de Mensagens
 * Lista de conversas
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { formatRelativeTime } from '../../utils/formatters';
import { FiMessageCircle, FiSearch, FiLock } from 'react-icons/fi';
import api from '../../services/api';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { socket, isConnected, isUserOnline } = useSocket();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    const handleNewMessage = (message) => {
      // Update conversation list
      setConversations((prev) => {
        const existingIndex = prev.findIndex(
          (conv) => conv.userId === message.senderId
        );

        if (existingIndex >= 0) {
          // Move to top and update
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: message,
            unreadCount: updated[existingIndex].unreadCount + 1,
          };
          return [updated[existingIndex], ...updated.slice(0, existingIndex), ...updated.slice(existingIndex + 1)];
        }

        return prev;
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, isConnected]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages');

      setConversations(response.data.conversations);
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiMessageCircle className="text-3xl text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mensagens
          </h1>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredConversations.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <FiMessageCircle className="text-5xl text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma mensagem ainda'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery
              ? 'Tente buscar por outro nome'
              : 'Comece conversando com seus criadores favoritos!'}
          </p>
        </div>
      ) : (
        /* Conversations List */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
          {filteredConversations.map((conversation) => {
            const isOnline = isUserOnline(conversation.userId);
            const hasUnread = conversation.unreadCount > 0;
            const isPPV = conversation.lastMessage?.isPPV && !conversation.lastMessage?.isUnlocked;

            return (
              <Link
                key={conversation.userId}
                to={`/messages/${conversation.userId}`}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  hasUnread ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={conversation.user.avatar || '/default-avatar.png'}
                    alt={conversation.user.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-semibold truncate ${hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {conversation.user.name}
                      {conversation.user.isVerified && (
                        <span className="ml-1 text-blue-500">✓</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatRelativeTime(conversation.lastMessage?.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPPV && <FiLock className="text-yellow-600 flex-shrink-0" />}
                    <p
                      className={`text-sm truncate ${
                        hasUnread
                          ? 'text-gray-900 dark:text-white font-medium'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {isPPV
                        ? 'Mensagem bloqueada (PPV)'
                        : conversation.lastMessage?.text || 'Mídia'}
                    </p>
                  </div>
                </div>

                {/* Unread Badge */}
                {hasUnread && (
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Messages;