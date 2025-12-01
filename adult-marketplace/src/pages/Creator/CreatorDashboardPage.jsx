import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';

export default function CreatorDashboardPage() {
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // User data from localStorage
  const [user, setUser] = useState(null);
  
  // API data
  const [stats, setStats] = useState({
    subscribers: 0,
    subscribersGrowth: 0,
    earnings: 0,
    earningsGrowth: 0,
    posts: 0,
    postsThisMonth: 0,
    engagement: 0,
    views: 0,
  });
  
  const [recentSubscribers, setRecentSubscribers] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [earningsChart, setEarningsChart] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Carregar dados do usuário
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

  // Buscar dados do dashboard
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      // Buscar estatísticas do criador
      const statsResponse = await fetch(
        `http://localhost:5000/api/v1/creator-dashboard/stats? timeRange=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (! statsResponse.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }

      const statsData = await statsResponse.json();
      
      // Atualizar stats
      if (statsData.data) {
        setStats({
          subscribers: statsData.data.subscribers || 0,
          subscribersGrowth: statsData.data. subscribersGrowth || 0,
          earnings: statsData. data.earnings || 0,
          earningsGrowth: statsData.data.earningsGrowth || 0,
          posts: statsData.data.posts || 0,
          postsThisMonth: statsData.data. postsThisMonth || 0,
          engagement: statsData. data.engagement || 0,
          views: statsData.data. views || 0,
        });
        
        // Atualizar gráfico de ganhos
        if (statsData. data.earningsChart) {
          setEarningsChart(statsData.data.earningsChart);
        }
      }

      // Buscar assinantes recentes
      const subscribersResponse = await fetch(
        'http://localhost:5000/api/v1/creator-dashboard/recent-subscribers? limit=5',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (subscribersResponse.ok) {
        const subscribersData = await subscribersResponse. json();
        setRecentSubscribers(subscribersData.data || []);
      }

      // Buscar top posts
      const postsResponse = await fetch(
        'http://localhost:5000/api/v1/creator-dashboard/top-posts?limit=3',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setTopPosts(postsData.data || []);
      }

      // Buscar notificações
      const notificationsResponse = await fetch(
        'http://localhost:5000/api/v1/creator-dashboard/notifications? limit=4',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (notificationsResponse.ok) {
        const notifData = await notificationsResponse. json();
        setNotifications(notifData.data || []);
      }

    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatDate = (dateStr) => {
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
  };

  // Loading State
  if (loading && !stats.subscribers) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <CreatorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <CreatorSidebar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-md">
            <svg xmlns="http://www.w3. org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 text-center mb-2">
              Erro ao Carregar
            </h3>
            <p className="text-red-700 dark:text-red-300 text-center mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
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
                <Link to="/creator-dashboard" className="flex items-center space-x-3">
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
                  <svg xmlns="http://www.w3. org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h. 582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                
                <Link to="/creator/notifications" className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.filter(n => n.unread). length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
                
                <Link to="/creator/profile" className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full px-4 sm:px-6 lg:px-4 py-4">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Bem-vindo de volta, {user?.displayName || user?.username || 'Criador'}!  👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Aqui está um resumo da sua performance
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link
              to="/creator/upload"
              className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl p-4 hover:shadow-lg transition-all group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="font-semibold">Novo Post</p>
              <p className="text-xs text-white/80">Upload de conteúdo</p>
            </Link>

            <Link
              to="/creator/posts"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-lg transition-all group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-indigo-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1. 586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-semibold text-slate-900 dark:text-white">Meus Posts</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stats.posts} publicações</p>
            </Link>

            <Link
              to="/creator/messages"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-lg transition-all group"
            >
              <svg xmlns="http://www.w3. org/2000/svg" className="h-8 w-8 mb-2 text-pink-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h. 01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-. 949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="font-semibold text-slate-900 dark:text-white">Mensagens</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Em breve</p>
            </Link>

            <Link
              to="/creator/earnings"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-lg transition-all group"
            >
              <svg xmlns="http://www.w3. org/2000/svg" className="h-8 w-8 mb-2 text-green-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 . 895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2. 599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2. 08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-slate-900 dark:text-white">Ganhos</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ver relatório</p>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Subscribers */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www. w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                {stats.subscribersGrowth > 0 && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    +{stats.subscribersGrowth. toFixed(1)}%
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
                {stats. earningsGrowth > 0 && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    +{stats.earningsGrowth.toFixed(1)}%
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

            {/* Engagement */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600 dark:text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3. 172 5. 172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6. 828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                  {formatNumber(stats.views)} views
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.engagement. toFixed(1)}%
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Taxa de engajamento</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Earnings Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ganhos Mensais</h2>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1. 5 text-slate-900 dark:text-white"
                  >
                    <option value="7days">Últimos 7 dias</option>
                    <option value="30days">Últimos 30 dias</option>
                    <option value="90days">Últimos 90 dias</option>
                    <option value="all">Todo período</option>
                  </select>
                </div>

                {/* Simple Bar Chart */}
                {earningsChart.length > 0 ?  (
                  <div className="flex items-end justify-between h-48 gap-2">
                    {earningsChart.map((item, index) => {
                      const maxAmount = Math.max(...earningsChart.map(i => i.amount || 0), 1);
                      const height = ((item.amount || 0) / maxAmount) * 100;

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative group cursor-pointer hover:opacity-80 transition-opacity" style={{ height: `${height}%` }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg"></div>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {formatCurrency(item.amount || 0)}
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2">{item.label || item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    <p>Sem dados de ganhos ainda</p>
                  </div>
                )}
              </div>

              {/* Top Posts */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Posts com Melhor Performance</h2>
                {topPosts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {topPosts.map(post => (
                      <div key={post.id} className="group cursor-pointer">
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                          <img src={post.thumbnail || post.image || 'https://placehold.co/150x150/8B7FE8/white? text=Post'} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          {post.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3. org/2000/svg" className="h-5 w-5 text-slate-900 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3. 172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115. 656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            {post.likes || 0}
                          </span>
                          <span className="flex items-center">
                            <svg xmlns="http://www. w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            {post.comments || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>Nenhum post publicado ainda</p>
                    <Link to="/creator/upload" className="text-indigo-600 hover:underline mt-2 inline-block">
                      Criar seu primeiro post →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Subscribers */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Novos Assinantes</h2>
                {recentSubscribers.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {recentSubscribers.map(subscriber => (
                        <div key={subscriber.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={subscriber.avatar || subscriber.user?. avatar || `https://placehold.co/50x50/8B7FE8/white?text=${(subscriber.name || subscriber.user?.username || 'U')[0]}`} 
                              alt={subscriber.name || subscriber. user?.username} 
                              className="w-10 h-10 rounded-full" 
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {subscriber.name || subscriber.user?.displayName || subscriber.user?.username}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {formatDate(subscriber.date || subscriber.createdAt)}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            +{formatCurrency(subscriber.amount || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Link to="/creator/subscribers" className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-4">
                      Ver todos →
                    </Link>
                  </>
                ) : (
                  <p className="text-center text-slate-400 py-4">Nenhum assinante ainda</p>
                )}
              </div>

              {/* Notifications */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Notificações</h2>
                {notifications.length > 0 ?  (
                  <>
                    <div className="space-y-3">
                      {notifications.map(notif => (
                        <div key={notif.id} className={`flex items-start space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 ${notif.unread ? 'bg-indigo-50 dark:bg-indigo-900/10 -mx-3 px-3 rounded-lg' : ''}`}>
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.unread ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900 dark:text-white">{notif.message}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {formatDate(notif.time || notif.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link to="/creator/notifications" className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-4">
                      Ver todas →
                    </Link>
                  </>
                ) : (
                  <p className="text-center text-slate-400 py-4">Sem notificações</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}