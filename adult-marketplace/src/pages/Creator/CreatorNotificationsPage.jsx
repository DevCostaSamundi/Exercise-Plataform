import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';
import { useNotifications } from '../../contexts/NotificationContext';

const notificationTypes = [
  { value: 'all', label: 'Todos', icon: '📋' },
  { value: 'subscriber', label: 'Assinantes', icon: '👥' },
  { value: 'comment', label: 'Comentários', icon: '💬' },
  { value: 'like', label: 'Curtidas', icon: '❤️' },
  { value: 'tip', label: 'Gorjetas', icon: '💰' },
  { value: 'message', label: 'Mensagens', icon: '✉️' },
  { value: 'payment', label: 'Pagamentos', icon: '💳' },
  { value: 'milestone', label: 'Conquistas', icon: '🏆' },
  { value: 'system', label: 'Sistema', icon: '⚙️' },
  { value: 'warning', label: 'Alertas', icon: '⚠️' },
];

export default function CreatorNotificationsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  const {
    notifications,
    unreadCount,
    loading,
    connected,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    bulkDelete,
  } = useNotifications();

  // Carregar notificações ao montar e quando filtros mudarem
  useEffect(() => {
    fetchNotifications({ type: typeFilter, unread: showOnlyUnread });
  }, [typeFilter, showOnlyUnread, fetchNotifications]);

  const filtered = useMemo(() => {
    let list = [...notifications];

    if (typeFilter !== 'all') {
      list = list.filter((n) => n.type.toLowerCase() === typeFilter);
    }

    if (showOnlyUnread) {
      list = list.filter((n) => n.unread);
    }

    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return list;
  }, [notifications, typeFilter, showOnlyUnread]);

  const handleToggleRead = async (id) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification.unread) {
      await markAsRead(id);
    } else {
      await markAsUnread(id);
    }
  };

  const handleDeleteNotification = async (id) => {
    await deleteNotification(id);
    setSelectedNotifications((prev) => prev.filter((nId) => nId !== id));
  };

  const handleToggleSelect = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filtered.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filtered.map((n) => n.id));
    }
  };

  const handleDeleteSelected = async () => {
    await bulkDelete(selectedNotifications);
    setSelectedNotifications([]);
  };

  const handleMarkSelectedRead = async () => {
    await Promise.all(selectedNotifications.map((id) => markAsRead(id)));
    setSelectedNotifications([]);
  };

  // Agrupar notificações por data
  const groupedNotifications = useMemo(() => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filtered.forEach((notif) => {
      const notifDate = new Date(notif.createdAt);
      notifDate.setHours(0, 0, 0, 0);

      let groupKey;
      if (notifDate.getTime() === today.getTime()) {
        groupKey = 'Hoje';
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groupKey = 'Ontem';
      } else {
        groupKey = notifDate.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notif);
    });

    return groups;
  }, [filtered]);

  // Stats baseados nos dados reais
  const stats = useMemo(() => ({
    unread: unreadCount,
    subscribers: notifications.filter((n) => n.type === 'SUBSCRIBER').length,
    interactions: notifications.filter((n) => ['LIKE', 'COMMENT'].includes(n.type)).length,
    payments: notifications.filter((n) => ['PAYMENT', 'TIP'].includes(n.type)).length,
  }), [notifications, unreadCount]);

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <CreatorSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/creator/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
                  <span className="text-white dark:text-black font-black text-xl">F</span>
                </div>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-900 dark:text-white text-lg">
                    Notificações
                  </h1>
                  {connected && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-800 dark:text-slate-800">
                      <span className="w-2 h-2 bg-slate-800 rounded-full animate-pulse"></span>
                      Ao vivo
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                to="/creator/settings"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Configurar notificações"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10. 325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-. 94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Marcar todas como lidas
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {/* Stats rápidos */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Não lidas</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.unread}</p>
                </div>
                <div className="w-10 h-10 bg-black dark:bg-black/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-black dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Assinantes</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.subscribers}</p>
                </div>
                <div className="w-10 h-10 bg-slate-800 dark:bg-slate-800/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-800 dark:text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-. 656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Interações</p>
                  <p className="text-2xl font-bold text-slate-400">{stats.interactions}</p>
                </div>
                <div className="w-10 h-10 bg-slate-400 dark:bg-slate-400/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-400 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3. 172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pagamentos</p>
                  <p className="text-2xl font-bold text-slate-600">{stats.payments}</p>
                </div>
                <div className="w-10 h-10 bg-slate-600 dark:bg-slate-600/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 . 895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-. 402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* Filtros */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {notificationTypes.slice(0, 6).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value)}
                    className={`px-3 py-1. 5 rounded-lg text-xs font-medium transition-all ${typeFilter === opt.value
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                  >
                    <span className="mr-1">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center space-x-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={showOnlyUnread}
                    onChange={(e) => setShowOnlyUnread(e.target.checked)}
                    className="w-4 h-4 text-black bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                  <span className="text-slate-600 dark:text-slate-300">
                    Apenas não lidas
                  </span>
                </label>
              </div>
            </div>

            {selectedNotifications.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {selectedNotifications.length} selecionada{selectedNotifications.length > 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkSelectedRead}
                    className="text-xs px-3 py-1. 5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Marcar como lidas
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-900/30 text-slate-900 dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-slate-900/50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Lista de notificações agrupadas */}
          <section className="space-y-4">
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Nenhuma notificação encontrada
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {showOnlyUnread
                    ? 'Você já leu todas as notificações!'
                    : 'Não há notificações para os filtros selecionados. '}
                </p>
              </div>
            ) : (
              Object.entries(groupedNotifications).map(([groupName, notifs]) => (
                <div key={groupName}>
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {groupName}
                    </h3>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {notifs.length} notificação{notifs.length > 1 ? 'ões' : ''}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {notifs.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${notif.unread ? 'bg-black/50 dark:bg-black/10' : ''
                          }`}
                      >
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={selectedNotifications.includes(notif.id)}
                            onChange={() => handleToggleSelect(notif.id)}
                            className="w-4 h-4 text-black bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-black dark:focus:ring-white"
                          />
                        </div>

                        <div className="flex-shrink-0">
                          <NotificationIcon type={notif.type} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                {notif.title}
                              </h4>
                              {notif.unread && (
                                <span className="text-[10px] font-semibold bg-black text-white px-1. 5 py-0.5 rounded-full">
                                  Novo
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap">
                              {formatDateTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                            {notif.message}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <button
                              onClick={() => handleToggleRead(notif.id)}
                              className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-black transition-colors"
                            >
                              {notif.unread ? 'Marcar como lida' : 'Marcar como não lida'}
                            </button>
                            <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
                            {notif.actionUrl && (
                              <>
                                <Link
                                  to={notif.actionUrl}
                                  className="text-black dark:text-black hover:text-black dark:hover:text-black font-medium transition-colors"
                                >
                                  Ver detalhes →
                                </Link>
                                <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteNotification(notif.id)}
                              className="text-slate-900 hover:text-slate-900 transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between py-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {selectedNotifications.length === filtered.length
                  ? 'Desmarcar todas'
                  : 'Selecionar todas'}
              </button>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Mostrando {filtered.length} de {notifications.length} notificações
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Helper:  formatDateTime
const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 1) {
    const m = Math.max(1, Math.floor(diffHours * 60));
    return `Há ${m} min`;
  }
  if (diffHours < 24) {
    return `Há ${Math.floor(diffHours)} h`;
  }
  if (diffDays < 7) {
    return `Há ${Math.floor(diffDays)} dias`;
  }
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Component: NotificationIcon
function NotificationIcon({ type }) {
  const iconConfigs = {
    SUBSCRIBER: {
      bgColor: 'bg-slate-800',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
        </svg>
      ),
    },
    COMMENT: {
      bgColor: 'bg-black',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-. 98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      ),
    },
    LIKE: {
      bgColor: 'bg-slate-400',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      ),
    },
    TIP: {
      bgColor: 'bg-slate-600',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9. 049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24. 588 1.81l-2.8 2.034a1 1 0 00-. 364 1.118l1.07 3.292c. 3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784. 57-1.838-. 197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-. 57-. 38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
    },
    MESSAGE: {
      bgColor: 'bg-black',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8. 118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
      ),
    },
    PAYMENT: {
      bgColor: 'bg-slate-800',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
        </svg>
      ),
    },
    MILESTONE: {
      bgColor: 'bg-slate-600',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01. 967. 744L14. 146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9. 854 12. 8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
        </svg>
      ),
    },
    SYSTEM: {
      bgColor: 'bg-slate-500',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11. 49 3.17c-. 38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286. 948c-1.372-. 836-2.942. 734-2.106 2.106.54.886. 061 2.042-.947 2.287-1.561. 379-1.561 2.6 0 2.978a1.532 1.532 0 01. 947 2.287c-. 836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c. 379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01. 947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-. 947-2.287c. 836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
    },
    WARNING: {
      bgColor: 'bg-slate-600',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-. 213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const config = iconConfigs[type] || iconConfigs.SYSTEM;

  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${config.bgColor}`}>
      {config.icon}
    </div>
  );
}