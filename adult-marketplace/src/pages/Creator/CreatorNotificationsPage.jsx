import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';

const mockNotifications = [
  {
    id: 1,
    type: 'subscriber', // subscriber | comment | like | payment | system
    title: 'Novo assinante!',
    message: 'Maria Silva acabou de assinar seu plano mensal.',
    createdAt: '2025-11-21T18:20:00',
    unread: true,
  },
  {
    id: 2,
    type: 'comment',
    title: 'Novo comentário',
    message: 'João Pedro comentou no seu post "Ensaio fotográfico sensual 🔥".',
    createdAt: '2025-11-21T17:10:00',
    unread: true,
  },
  {
    id: 3,
    type: 'like',
    title: 'Seu conteúdo está bombando',
    message: 'Seu vídeo "Behind the scenes" atingiu 300 curtidas.',
    createdAt: '2025-11-20T22:00:00',
    unread: false,
  },
  {
    id: 4,
    type: 'payment',
    title: 'Pagamento aprovado',
    message: 'PIX de R$ 1.247,00 recebido na sua conta de criador.',
    createdAt: '2025-11-19T12:30:00',
    unread: false,
  },
  {
    id: 5,
    type: 'system',
    title: 'Atualização de Termos',
    message: 'Atualizamos nossos Termos de Uso para Criadores.',
    createdAt: '2025-11-18T09:15:00',
    unread: false,
  },
];

const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const m = Math.max(1, Math.floor(diffHours * 60));
    return `Há ${m} min`;
  }
  if (diffHours < 24) {
    return `Há ${Math.floor(diffHours)} h`;
  }
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function CreatorNotificationsPage() {
  const [typeFilter, setTypeFilter] = useState('all'); // all | subscriber | comment | like | payment | system
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = useMemo(() => {
    let list = [...notifications];

    if (typeFilter !== 'all') {
      list = list.filter((n) => n.type === typeFilter);
    }

    if (showOnlyUnread) {
      list = list.filter((n) => n.unread);
    }

    // Ordenar por data desc
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return list;
  }, [notifications, typeFilter, showOnlyUnread]);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        unread: false,
      })),
    );
  };

  const handleToggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              unread: !n.unread,
            }
          : n,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <CreatorSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header topo */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-xl">P</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Notificações</span>
                </Link>
              </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                Marcar todas como lidas
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {/* Explicação / CTA */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Aqui você poderá centralizar notificações de novos assinantes,
              comentários, likes e pagamentos. No futuro, esses dados virão da
              API em tempo real.
            </p>
          </section>

          {/* Filtros */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-slate-500 dark:text-slate-400">
                Tipo:
              </span>
              {[
                { value: 'all', label: 'Todos' },
                { value: 'subscriber', label: 'Assinantes' },
                { value: 'comment', label: 'Comentários' },
                { value: 'like', label: 'Likes' },
                { value: 'payment', label: 'Pagamentos' },
                { value: 'system', label: 'Sistema' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={`px-3 py-1 rounded-full border ${
                    typeFilter === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyUnread}
                  onChange={(e) => setShowOnlyUnread(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-600 dark:text-slate-300">
                  Mostrar apenas não lidas
                </span>
              </label>
            </div>
          </section>

          {/* Lista de notificações */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma notificação encontrada para os filtros atuais.
              </div>
            ) : (
              filtered.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 flex items-start gap-3 ${
                    notif.unread
                      ? 'bg-indigo-50 dark:bg-indigo-900/10'
                      : 'bg-transparent'
                  }`}
                >
                  <div className="mt-1">
                    <NotificationIcon type={notif.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {notif.title}
                        </h3>
                        {notif.unread && (
                          <span className="text-[10px] font-semibold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                            Novo
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {formatDateTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {notif.message}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <button
                        onClick={() => handleToggleRead(notif.id)}
                        className="hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        {notif.unread
                          ? 'Marcar como lida'
                          : 'Marcar como não lida'}
                      </button>
                      <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
                      <button className="hover:text-slate-800 dark:hover:text-slate-200">
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function NotificationIcon({ type }) {
  const base =
    'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm';
  switch (type) {
    case 'subscriber':
      return (
        <div className={`${base} bg-emerald-500`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0z" />
            <path
              fillRule="evenodd"
              d="M2 13.5A3.5 3.5 0 015.5 10h3A3.5 3.5 0 0112 13.5V15a1 1 0 11-2 0v-1.5a1.5 1.5 0 00-1.5-1.5h-3A1.5 1.5 0 004 13.5V15a1 1 0 11-2 0v-1.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    case 'comment':
      return (
        <div className={`${base} bg-indigo-500`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M18 10c0 3.866-3.582 7-8 7a8.96 8.96 0 01-4.9-1.5L2 17l1.5-3.1A7.963 7.963 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
          </svg>
        </div>
      );
    case 'like':
      return (
        <div className={`${base} bg-pink-500`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    case 'payment':
      return (
        <div className={`${base} bg-emerald-600`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path
              fillRule="evenodd"
              d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zm-5 3a2 2 0 11-4 0 2 2 0 014 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    case 'system':
    default:
      return (
        <div className={`${base} bg-slate-500`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.59A1.75 1.75 0 0116.768 17H3.232a1.75 1.75 0 01-1.493-2.311l6.518-11.59z" />
          </svg>
        </div>
      );
  }
}