// src/pages/ExplorePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import creatorService from '../services/creatorService';
import Sidebar from '../components/Sidebar';
import { FiSliders, FiX } from 'react-icons/fi';

const SORT_OPTIONS = {
  POPULAR: 'popular',
  RECENT: 'recent',
  ALPHABETICAL: 'alphabetical',
  PRICE_LOW:  'price-low',
  PRICE_HIGH: 'price-high',
};

export default function ExplorePage() {
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.POPULAR);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    verified: false,
    minPrice: '',
    maxPrice: '',
    category: '',
  });

  useEffect(() => {
    fetchCreators(1, false);
  }, [sortBy, filters]);

  const fetchCreators = async (pageNum, append = true) => {
    try {
      setLoading(true);
      setError(null);

      const response = await creatorService.listCreators({
        page: pageNum,
        limit: 20,
        sort: sortBy,
        verified: filters.verified || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters. maxPrice || undefined,
        category: filters.category || undefined,
      });

      if (response.success) {
        const newCreators = response.data || [];
        const pagination = response.pagination || {};

        if (append) {
          setCreators((prev) => [...prev, ...newCreators]);
        } else {
          setCreators(newCreators);
        }

        setHasMore(pagination.page < pagination.pages);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Erro ao buscar criadores:', err);
      setError(err.response?.data?.message || 'Erro ao carregar criadores');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (! loading && hasMore) {
      fetchCreators(page + 1, true);
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    setPage(1);
    fetchCreators(1, false);
  };

  const clearFilters = () => {
    setFilters({
      verified:  false,
      minPrice: '',
      maxPrice: '',
      category: '',
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-slate-900 dark: text-white">
                Explorar Criadores
              </h1>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <FiSliders />
                <span>Filtros</span>
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { value: SORT_OPTIONS.POPULAR, label: 'Mais Populares' },
                { value: SORT_OPTIONS.RECENT, label: 'Mais Recentes' },
                { value: SORT_OPTIONS. ALPHABETICAL, label: 'A-Z' },
                { value: SORT_OPTIONS.PRICE_LOW, label: 'Menor Preço' },
                { value: SORT_OPTIONS.PRICE_HIGH, label: 'Maior Preço' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                    sortBy === option.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {option. label}
                </button>
              ))}
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark: border-slate-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Filtros</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <FiX />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.verified}
                        onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Apenas Verificados
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Preço Mínimo
                    </label>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      placeholder="$ 0"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Preço Máximo
                    </label>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      placeholder="$ 100"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark: text-slate-300 mb-1">
                      Categoria
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ... filters, category: e.target. value })}
                      className="w-full px-3 py-2 bg-white dark: bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark: text-white"
                    >
                      <option value="">Todas</option>
                      <option value="fitness">Fitness</option>
                      <option value="lifestyle">Lifestyle</option>
                      <option value="art">Arte</option>
                      <option value="music">Música</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-indigo-600 hover: bg-indigo-700 text-white rounded-lg"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Error */}
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  ⚠️ {error}
                </p>
              </div>
            )}

            {/* Loading */}
            {loading && creators.length === 0 ?  (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : creators.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Nenhum criador encontrado
              </div>
            ) : (
              <>
                {/* Creators Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {creators.map((creator) => (
                    <div
                      key={creator.id}
                      onClick={() => navigate(`/creator/${creator.username || creator.id}`)}
                      className="cursor-pointer bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark: border-slate-800 overflow-hidden hover:shadow-xl transition-all"
                    >
                      {/* Avatar */}
                      <div className="aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        {creator.avatar ? (
                          <img src={creator.avatar} alt={creator.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-4xl font-bold">
                            {creator.displayName?. charAt(0) || 'C'}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-slate-900 dark: text-white truncate">
                          {creator. displayName}
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          @{creator.username}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                          {creator.bio}
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-lg font-bold text-indigo-600">
                            ${creator.subscriptionPrice}/mês
                          </span>
                          <span className="text-sm text-slate-500">
                            {creator.subscribers} assinantes
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="bg-indigo-600 hover: bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      {loading ? 'Carregando...' : 'Carregar mais'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}