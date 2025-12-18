import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function CreatorDashboardPage() {
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // ✅ CORRIGIDO: Garantir que todos os valores sejam números
  const [stats, setStats] = useState({
    subscribers: 0,
    subscribersGrowth: 0,
    earnings: 0,
    earningsGrowth: 0,
    posts: 0,
    postsThisMonth: 0,
    engagement: 0, // Sempre número
    views: 0,
  });

  const [recentSubscribers, setRecentSubscribers] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [earningsChart, setEarningsChart] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (err) {
        console.error('Erro ao parsear user:', err);
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  // ✅ Helper para garantir valores numéricos
  const toNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const statsResponse = await api.get(
        `/creator-dashboard/stats?timeRange=${timeRange}`
      );

      // ✅ CORRIGIDO: Forçar conversão para número
      if (statsResponse.data?.data) {
        const data = statsResponse.data.data;
        setStats({
          subscribers: toNumber(data.subscribers),
          subscribersGrowth: toNumber(data.subscribersGrowth),
          earnings: toNumber(data.earnings),
          earningsGrowth: toNumber(data.earningsGrowth),
          posts: toNumber(data.posts),
          postsThisMonth: toNumber(data.postsThisMonth),
          engagement: toNumber(data.engagement), // ✅ Sempre número
          views: toNumber(data.views),
        });

        if (data.earningsChart && Array.isArray(data.earningsChart)) {
          setEarningsChart(data.earningsChart);
        }
      }

      // Buscar dados adicionais (opcional - não quebra se falhar)
      try {
        const subscribersResponse = await api.get(
          '/creator-dashboard/recent-subscribers?limit=5'
        );
        setRecentSubscribers(subscribersResponse.data?.data || []);
      } catch (err) {
        console.warn('Rota de assinantes não disponível:', err.message);
      }

      try {
        const postsResponse = await api.get(
          '/creator-dashboard/top-posts?limit=3'
        );
        setTopPosts(postsResponse.data?.data || []);
      } catch (err) {
        console.warn('Rota de posts não disponível:', err.message);
      }

      try {
        const notificationsResponse = await api.get(
          '/creator-dashboard/notifications?limit=4'
        );
        setNotifications(notificationsResponse.data?.data || []);
      } catch (err) {
        console.warn('Rota de notificações não disponível:', err.message);
      }

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(toNumber(value));
  };

  const formatNumber = (num) => {
    const n = toNumber(num);
    if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'k';
    }
    return n.toString();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Há pouco tempo';

    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return `Há ${Math.floor(diffInHours * 60)} minutos`;
      } else if (diffInHours < 24) {
        return `Há ${Math.floor(diffInHours)} horas`;
      } else if (diffInHours < 48) {
        return 'Ontem';
      } else {
        return `Há ${Math.floor(diffInHours / 24)} dias`;
      }
    } catch {
      return 'Data inválida';
    }
  };

  if (loading && !stats.subscribers) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <CreatorSidebar />
        <div className="flex-1">
          <LoadingSpinner size="lg" message="Carregando dashboard..." fullScreen={false} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <CreatorSidebar />
        <div className="flex-1">
          <ErrorMessage
            message={error}
            onRetry={fetchDashboardData}
            title="Erro ao Carregar Dashboard"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <CreatorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link to="/creator/dashboard" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-xl">P</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Dashboard</span>
                </Link>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
                  title="Atualizar dados"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full px-4 sm:px-6 lg:px-4 py-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Bem-vindo de volta, {user?.displayName || user?.username || 'Criador'}! 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Aqui está um resumo da sua performance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Subscribers */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                {stats.subscribersGrowth > 0 && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    +{toNumber(stats.subscribersGrowth).toFixed(1)}%
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {formatNumber(stats.subscribers)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Assinantes</p>
            </div>

            {/* Earnings */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                {stats.earningsGrowth > 0 && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    +{toNumber(stats.earningsGrowth).toFixed(1)}%
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {formatCurrency(stats.earnings)}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ganhos totais</p>
            </div>

            {/* Posts */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                  {stats.postsThisMonth} este mês
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.posts}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Posts publicados</p>
            </div>

            {/* Engagement - ✅ CORRIGIDO */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600 dark:text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                  {formatNumber(stats.views)} views
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {toNumber(stats.engagement).toFixed(1)}%
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Taxa de engajamento</p>
            </div>
          </div>

          {/* Mensagem informativa se não há dados */}
          {stats.subscribers === 0 && stats.posts === 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                🚀 Comece sua jornada!
              </h3>
              <p className="text-indigo-700 dark:text-indigo-300 mb-4">
                Seu dashboard está vazio. Que tal criar seu primeiro post?
              </p>
              <Link
                to="/creator/upload"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Criar primeiro post →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}