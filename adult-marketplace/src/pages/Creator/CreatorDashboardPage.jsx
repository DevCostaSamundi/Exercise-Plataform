import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function CreatorDashboardPage() {
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, 90days, all

  // Mock data (em produção viria da API)
  const stats = {
    subscribers: 1247,
    subscribersGrowth: 12.5,
    earnings: 24940.50,
    earningsGrowth: 18.2,
    posts: 156,
    postsThisMonth: 23,
    engagement: 8.7, // média de likes/comments por post
    views: 45230,
  };

  const recentSubscribers = [
    { id: 1, name: 'Maria Silva', avatar: 'https://placehold.co/50x50/8B7FE8/white?text=M', date: 'Há 2 horas', amount: 24.90 },
    { id: 2, name: 'João Pedro', avatar: 'https://placehold.co/50x50/6366F1/white?text=J', date: 'Há 5 horas', amount: 24.90 },
    { id: 3, name: 'Ana Costa', avatar: 'https://placehold.co/50x50/A78BFA/white?text=A', date: 'Há 1 dia', amount: 24.90 },
    { id: 4, name: 'Carlos Lima', avatar: 'https://placehold.co/50x50/EC4899/white?text=C', date: 'Há 1 dia', amount: 24.90 },
    { id: 5, name: 'Beatriz Santos', avatar: 'https://placehold.co/50x50/8B5CF6/white?text=B', date: 'Há 2 dias', amount: 24.90 },
  ];

  const topPosts = [
    { id: 1, thumbnail: 'https://placehold.co/150x150/8B7FE8/white?text=Post1', likes: 342, comments: 45, type: 'photo' },
    { id: 2, thumbnail: 'https://placehold.co/150x150/6366F1/white?text=Post2', likes: 298, comments: 38, type: 'video' },
    { id: 3, thumbnail: 'https://placehold.co/150x150/EC4899/white?text=Post3', likes: 267, comments: 32, type: 'photo' },
  ];

  const earningsChart = [
    { month: 'Jan', amount: 18500 },
    { month: 'Fev', amount: 19200 },
    { month: 'Mar', amount: 21300 },
    { month: 'Abr', amount: 22100 },
    { month: 'Mai', amount: 23800 },
    { month: 'Jun', amount: 24940 },
  ];

  const notifications = [
    { id: 1, type: 'subscriber', message: 'Maria Silva se inscreveu', time: 'Há 2 horas', unread: true },
    { id: 2, type: 'comment', message: 'João comentou no seu post', time: 'Há 3 horas', unread: true },
    { id: 3, type: 'like', message: 'Seu post atingiu 300 curtidas', time: 'Há 5 horas', unread: false },
    { id: 4, type: 'payment', message: 'Pagamento de R$ 1.247,00 aprovado', time: 'Há 1 dia', unread: false },
  ];

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-xl">P</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Link to="/creator/profile" className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Bem-vindo de volta, Luna! 👋
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-semibold text-slate-900 dark:text-white">Meus Posts</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stats.posts} publicações</p>
          </Link>

          <Link
            to="/creator/messages"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-lg transition-all group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-pink-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="font-semibold text-slate-900 dark:text-white">Mensagens</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">12 não lidas</p>
          </Link>

          <Link
            to="/creator/earnings"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-lg transition-all group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-green-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                +{stats.subscribersGrowth}%
              </span>
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
              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                +{stats.earningsGrowth}%
              </span>
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
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                {formatNumber(stats.views)} views
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {stats.engagement}%
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
                  className="text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white"
                >
                  <option value="7days">Últimos 7 dias</option>
                  <option value="30days">Últimos 30 dias</option>
                  <option value="90days">Últimos 90 dias</option>
                  <option value="all">Todo período</option>
                </select>
              </div>

              {/* Simple Bar Chart */}
              <div className="flex items-end justify-between h-48 gap-2">
                {earningsChart.map((item, index) => {
                  const maxAmount = Math.max(...earningsChart.map(i => i.amount));
                  const height = (item.amount / maxAmount) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative group cursor-pointer hover:opacity-80 transition-opacity" style={{ height: `${height}%` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg"></div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-2">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Posts */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Posts com Melhor Performance</h2>
              <div className="grid grid-cols-3 gap-4">
                {topPosts.map(post => (
                  <div key={post.id} className="group cursor-pointer">
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                      <img src={post.thumbnail} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {post.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-900 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        {post.likes}
                      </span>
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        {post.comments}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Subscribers */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Novos Assinantes</h2>
              <div className="space-y-3">
                {recentSubscribers.map(subscriber => (
                  <div key={subscriber.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={subscriber.avatar} alt={subscriber.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{subscriber.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{subscriber.date}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      +{formatCurrency(subscriber.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/creator/subscribers" className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-4">
                Ver todos →
              </Link>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Notificações</h2>
              <div className="space-y-3">
                {notifications.map(notif => (
                  <div key={notif.id} className={`flex items-start space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 ${notif.unread ? 'bg-indigo-50 dark:bg-indigo-900/10 -mx-3 px-3 rounded-lg' : ''}`}>
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.unread ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 dark:text-white">{notif.message}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/creator/notifications" className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-4">
                Ver todas →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}