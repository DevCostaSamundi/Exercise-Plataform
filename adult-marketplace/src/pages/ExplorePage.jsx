import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function ExplorePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creators, setCreators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    fetchCreators();
  }, [category, sortBy]);

  const fetchCreators = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/creators?category=${category}&sort=${sortBy}&search=${searchTerm}`);
      setCreators(response.data?.data || []);
    } catch (err) {
      console.error('Erro ao carregar criadores:', err);
      setError(err.response?.data?.message || 'Erro ao carregar criadores');
      
      // Mock data
      setCreators([
        { id: 1, username: 'creator1', displayName: 'Creator One', avatar: null, subscribers: 1200, price: 9.99, category: 'fitness', verified: true },
        { id: 2, username: 'creator2', displayName: 'Creator Two', avatar: null, subscribers: 850, price: 12.99, category: 'art', verified: false },
        { id: 3, username: 'creator3', displayName: 'Creator Three', avatar: null, subscribers: 2100, price: 14.99, category: 'music', verified: true },
        { id: 4, username: 'creator4', displayName: 'Creator Four', avatar: null, subscribers: 650, price: 7.99, category: 'cooking', verified: false },
        { id: 5, username: 'creator5', displayName: 'Creator Five', avatar: null, subscribers: 1890, price: 11.99, category: 'gaming', verified: true },
        { id: 6, username: 'creator6', displayName: 'Creator Six', avatar: null, subscribers: 450, price: 6.99, category: 'lifestyle', verified: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCreators();
  };

  const filteredCreators = creators.filter(creator =>
    creator.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1">
          <LoadingSpinner size="lg" message="Explorando criadores..." />
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              🔍 Explorar Criadores
            </h1>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar criadores..."
                  className="w-full px-4 py-3 pl-12 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  <option value="all">Todas</option>
                  <option value="fitness">Fitness</option>
                  <option value="art">Arte</option>
                  <option value="music">Música</option>
                  <option value="cooking">Culinária</option>
                  <option value="gaming">Gaming</option>
                  <option value="lifestyle">Lifestyle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  <option value="popular">Mais Popular</option>
                  <option value="newest">Mais Recentes</option>
                  <option value="price-low">Menor Preço</option>
                  <option value="price-high">Maior Preço</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  ⚠️ Dados de demonstração - API não conectada
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>

            {filteredCreators.length === 0 && (
              <div className="text-center py-16">
                <p className="text-slate-600 dark:text-slate-400">
                  Nenhum criador encontrado. Tente ajustar os filtros.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatorCard({ creator }) {
  return (
    <Link
      to={`/creator/${creator.username}`}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {creator.displayName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">
              {creator.displayName}
            </h3>
            {creator.verified && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">@{creator.username}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Assinantes</p>
          <p className="font-bold text-slate-900 dark:text-white">{creator.subscribers}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 dark:text-slate-400">Assinatura</p>
          <p className="font-bold text-indigo-600 dark:text-indigo-400">
            R$ {(creator.price * 5.5).toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  );
}
