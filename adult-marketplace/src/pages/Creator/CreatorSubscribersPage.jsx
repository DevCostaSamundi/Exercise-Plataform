import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';

const mockSubscribers = [
  {
    id: 1,
    name: 'Maria Silva',
    avatar: 'https://placehold.co/48x48/8B7FE8/white?text=M',
    username: 'maria.silva',
    plan: 'Mensal',
    since: '2025-09-12',
    lastPayment: '2025-11-10',
    status: 'active', // active, canceled, overdue
    lifetimeValue: 249.9,
    country: 'BR',
  },
  {
    id: 2,
    name: 'João Pedro',
    avatar: 'https://placehold.co/48x48/6366F1/white?text=J',
    username: 'joaopedro',
    plan: 'Trimestral',
    since: '2025-08-01',
    lastPayment: '2025-11-01',
    status: 'active',
    lifetimeValue: 349.7,
    country: 'BR',
  },
  {
    id: 3,
    name: 'Ana Costa',
    avatar: 'https://placehold.co/48x48/A78BFA/white?text=A',
    username: 'anacosta',
    plan: 'Mensal',
    since: '2025-10-05',
    lastPayment: '2025-10-05',
    status: 'overdue',
    lifetimeValue: 24.9,
    country: 'PT',
  },
  {
    id: 4,
    name: 'Carlos Lima',
    avatar: 'https://placehold.co/48x48/EC4899/white?text=C',
    username: 'carlos.l',
    plan: 'Anual',
    since: '2025-01-15',
    lastPayment: '2025-09-15',
    status: 'canceled',
    lifetimeValue: 199.9,
    country: 'BR',
  },
  {
    id: 5,
    name: 'Beatriz Santos',
    avatar: 'https://placehold.co/48x48/8B5CF6/white?text=B',
    username: 'bia.santos',
    plan: 'Mensal',
    since: '2025-11-01',
    lastPayment: '2025-11-01',
    status: 'active',
    lifetimeValue: 24.9,
    country: 'BR',
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export default function CreatorSubscribersPage() {
  const [search, setSearch] = useState('');
  // comentários indicam os tipos esperados, mas agora é JS puro
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'canceled' | 'overdue'
  const [planFilter, setPlanFilter] = useState('all');     // 'all' | 'Mensal' | 'Trimestral' | 'Anual'
  const [sortBy, setSortBy] = useState('recent');          // 'recent' | 'lifetime' | 'name'
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredSubscribers = useMemo(() => {
    let result = [...mockSubscribers];

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (sub) =>
          sub.name.toLowerCase().includes(s) ||
          sub.username.toLowerCase().includes(s),
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((sub) => sub.status === statusFilter);
    }

    if (planFilter !== 'all') {
      result = result.filter((sub) => sub.plan === planFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'lifetime') {
        return b.lifetimeValue - a.lifetimeValue;
      }
      // recent: ordenar por since (mais recente primeiro)
      return new Date(b.since).getTime() - new Date(a.since).getTime();
    });

    return result;
  }, [search, statusFilter, planFilter, sortBy]);

  const total = filteredSubscribers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginated = filteredSubscribers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const stats = {
    total: mockSubscribers.length,
    active: mockSubscribers.filter((s) => s.status === 'active').length,
    canceled: mockSubscribers.filter((s) => s.status === 'canceled').length,
    overdue: mockSubscribers.filter((s) => s.status === 'overdue').length,
    mrr: 24.9 * mockSubscribers.filter((s) => s.status === 'active').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <CreatorSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header topo */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-xl">P</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Assinantes</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {stats.total} assinante(s) no total
                  </p>
                </Link>
              </div>

            <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Ativos: {stats.active}</span>
              </span>
              <span>•</span>
              <span>MRR estimado: {formatCurrency(stats.mrr)}</span>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ativos</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Cancelados</p>
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.canceled}</p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">MRR</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.mrr)}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e busca */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por nome ou username..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Ativos</option>
                  <option value="canceled">Cancelados</option>
                  <option value="overdue">Em atraso</option>
                </select>

                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todos os planos</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Anual">Anual</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="name">Nome A-Z</option>
                  <option value="lifetime">Maior valor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabela de assinantes */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Assinante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Assinante desde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Valor total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <svg className="w-12 h-12 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-slate-500 dark:text-slate-400">Nenhum assinante encontrado</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={subscriber.avatar}
                              alt={subscriber.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {subscriber.name}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                @{subscriber.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {subscriber.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={subscriber.status} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(subscriber.since)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(subscriber.lifetimeValue)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium">
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando {(currentPage - 1) * pageSize + 1} a{' '}
                  {Math.min(currentPage * pageSize, total)} de {total} resultados
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config =
    {
      active: {
        label: 'Ativo',
        className:
          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      },
      canceled: {
        label: 'Cancelado',
        className:
          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
      },
      overdue: {
        label: 'Em atraso',
        className:
          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      },
    }[status] || {
      label: status,
      className:
        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}