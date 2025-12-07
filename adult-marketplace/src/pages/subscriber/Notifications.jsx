/**
 * Centro de Notificações
 * Todas as notificações do usuário
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from '../../components/subscriber/NotificationItem';
import { FiBell, FiCheckCircle, FiFilter } from 'react-icons/fi';
import { useState } from 'react';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
  } = useNotifications();

  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);

    // Navigate based on notification type
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => ! n.read)
      : notifications;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiBell className="text-3xl text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notificações
            </h1>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              <FiCheckCircle />
              Marcar Todas como Lidas
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'unread'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Não Lidas ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <FiBell className="text-5xl text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {filter === 'unread'
              ? 'Nenhuma notificação não lida'
              : 'Nenhuma notificação'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Você será notificado sobre novidades aqui! 
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClick={handleNotificationClick}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ?  'Carregando...' : 'Carregar Mais'}
              </button>
            </div>
          )}

          {!hasMore && filteredNotifications.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              Todas as notificações foram carregadas
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;