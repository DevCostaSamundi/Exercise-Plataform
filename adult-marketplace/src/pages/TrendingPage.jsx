import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency } from '../config/constants';

export default function TrendingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendingCreators, setTrendingCreators] = useState([]);
  const [filter, setFilter] = useState('all'); // all, new, rising, top

  useEffect(() => {
    fetchTrendingCreators();
  }, [filter]);

  const fetchTrendingCreators = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/creators/trending?filter=${filter}`);
      setTrendingCreators(response.data?.data || []);
    } catch (err) {
      console.error('Erro ao carregar criadores em alta:', err);
      setError(err.response?.data?.message || 'Erro ao carregar criadores');
      
      // Mock data for demonstration
      setTrendingCreators([
        {
          id: 1,
          username: 'sophiastar',
          displayName: 'Sophia Star',
          avatar: null,
          subscribers: 12450,
          postsCount: 234,
          subscriptionPrice: 19.99,
          bio: 'Modelo profissional e criadora de conteúdo premium 💫',
          verified: true,
          trending: '+245%',
        },
        {
          id: 2,
          username: 'lucasfit',
          displayName: 'Lucas Fitness',
          avatar: null,
          subscribers: 8920,
          postsCount: 189,
          subscriptionPrice: 14.99,
          bio: 'Personal trainer e lifestyle 💪',
          verified: true,
          trending: '+189%',
        },
        {
          id: 3,
          username: 'mariaart',
          displayName: 'Maria Art',
          avatar: null,
          subscribers: 6540,
          postsCount: 145,
          subscriptionPrice: 12.99,
          bio: 'Artista e fotografa 🎨',
          verified: false,
          trending: '+156%',
        },
        {
          id: 4,
          username: 'rafamusic',
          displayName: 'Rafa Music',
          avatar: null,
          subscribers: 5230,
          postsCount: 98,
          subscriptionPrice: 9.99,
          bio: 'Músico e compositor 🎵',
          verified: true,
          trending: '+134%',
        },
        {
          id: 5,
          username: 'anacooking',
          displayName: 'Ana Cooking',
          avatar: null,
          subscribers: 4180,
          postsCount: 76,
          subscriptionPrice: 7.99,
          bio: 'Chef e criadora de receitas 👩‍🍳',
          verified: false,
          trending: '+98%',
        },
        {
          id: 6,
          username: 'pedrogamer',
          displayName: 'Pedro Gamer',
          avatar: null,
          subscribers: 3920,
          postsCount: 134,
          subscriptionPrice: 11.99,
          bio: 'Streamer e gamer profissional 🎮',
          verified: true,
          trending: '+87%',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1">
          <LoadingSpinner size="lg" message="Carregando criadores em alta..." />
        </div>
      </div>
    );
  }

  if (error && trendingCreators.length === 0) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1">
          <ErrorMessage 
            message={error} 
            onRetry={fetchTrendingCreators}
            title="Erro ao Carregar Trending"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  🔥 Criadores em Alta
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Descubra os criadores mais populares e em crescimento
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('new')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'new'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Novos
                </button>
                <button
                  onClick={() => setFilter('rising')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'rising'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Em Crescimento
                </button>
                <button
                  onClick={() => setFilter('top')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'top'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Top
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Demo Warning */}
            {error && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium">
                    Dados de demonstração - API não conectada
                  </p>
                </div>
              </div>
            )}

            {/* Creators Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>

            {/* Empty State */}
            {trendingCreators.length === 0 && !loading && (
              <div className="text-center py-16">
                <svg
                  className="mx-auto h-24 w-24 text-slate-400 dark:text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Nenhum criador encontrado
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Não encontramos criadores em alta no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Creator Card Component
function CreatorCard({ creator }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Link
      to={`/creator/${creator.username}`}
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Trending Badge */}
      <div className="absolute top-3 right-3 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
            clipRule="evenodd"
          />
        </svg>
        {creator.trending}
      </div>

      {/* Avatar */}
      <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        {creator.avatar ? (
          <img
            src={creator.avatar}
            alt={creator.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white text-5xl font-bold">
            {getInitials(creator.displayName)}
          </span>
        )}
        {/* Verified Badge */}
        {creator.verified && (
          <div className="absolute bottom-3 left-3 bg-blue-500 text-white p-1.5 rounded-full">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {creator.displayName}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          @{creator.username}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
          {creator.bio}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Assinantes</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {creator.subscribers.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Posts</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {creator.postsCount}
            </p>
          </div>
        </div>

        {/* Subscribe Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(creator.subscriptionPrice)}/mês
          </span>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Assinar
          </button>
        </div>
      </div>
    </Link>
  );
}
