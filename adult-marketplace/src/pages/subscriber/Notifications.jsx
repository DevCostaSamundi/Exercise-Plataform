// src/pages/subscriber/Notifications.jsx
import Sidebar from '../../components/Sidebar';
import { useNotifications } from '../../hooks/useNotifications';

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
  } = useNotifications();

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notificações
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm bg-black hover:bg-black text-white px-4 py-2 rounded-lg font-medium"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        {loading && notifications.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Carregando notificações...</p>
          </div>
        )}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhuma notificação encontrada.
          </div>
        )}
        <ul className="space-y-4">
          {notifications.map((n) => (
            <li
              key={n._id}
              className={`p-4 rounded-lg shadow-sm border ${n.read ? 'bg-gray-50 dark:bg-gray-900' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{n.title || 'Notificação'}</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{n.body || n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n._id)}
                    className="ml-4 text-xs bg-black hover:bg-black text-white px-3 py-1 rounded"
                  >
                    Marcar como lida
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {hasMore && (
          <div className="text-center mt-6">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-black hover:bg-black text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}