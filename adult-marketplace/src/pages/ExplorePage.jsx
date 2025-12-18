import { useState, useEffect } from 'react';
import creatorService from '../services/creatorService'; // USAR SERVIÇO
import subscriptionService from '../services/subscriptionService'; // USAR SERVIÇO
import { SORT_OPTIONS } from '../config/constants';
import CreatorCard from '../components/subscriber/CreatorCard';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import { FiSliders, FiX } from 'react-icons/fi';

const Explore = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS. POPULAR);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    verified: false,
    minPrice: '',
    maxPrice: '',
    category: '',
  });

  const lastCreatorRef = useInfiniteScroll(loadMore, hasMore, loading);

  useEffect(() => {
    fetchCreators(1, false);
  }, [sortBy, filters]);

  const fetchCreators = async (pageNum, append = true) => {
    try {
      setLoading(true);

      const response = await creatorService.listCreators({
        page: pageNum,
        limit: 20,
        sort:  sortBy,
        verified: filters.verified || undefined,
        minPrice: filters. minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        category: filters.category || undefined,
      });

      const newCreators = response.data || [];
      const pagination = response.pagination || {};

      if (append) {
        setCreators((prev) => [...prev, ...newCreators]);
      } else {
        setCreators(newCreators);
      }

      setHasMore(pagination.page < pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Erro ao buscar criadores:', err);
    } finally {
      setLoading(false);
    }
  };

  function loadMore() {
    if (!loading && hasMore) {
      fetchCreators(page + 1, true);
    }
  }

  const handleSubscribe = async (creatorId, isSubscribing) => {
    try {
      if (isSubscribing) {
        // ✅ USAR SERVIÇO CORRETO
        await subscriptionService. createSubscription(creatorId);
      } else {
        // Aqui precisa do subscriptionId, não creatorId
        // Vamos buscar a subscription primeiro
        const subs = await subscriptionService.getSubscriptions();
        const subscription = subs.data?. find(s => s.creatorId === creatorId && s.status === 'ACTIVE');
        
        if (subscription) {
          await subscriptionService.cancelSubscription(subscription.id);
        }
      }
      
      // Atualizar lista
      fetchCreators(1, false);
    } catch (err) {
      console.error('Erro ao gerenciar assinatura:', err);
      alert(err.response?.data?.message || 'Erro ao processar assinatura');
      throw err;
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
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
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
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
            { value: SORT_OPTIONS. PRICE_HIGH, label: 'Maior Preço' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option. value)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                sortBy === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {option. label}
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark: border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
                    onChange={(e) => setFilters({ ...filters, verified: e. target.checked })}
                    className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus: ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Apenas Verificados
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preço Mínimo
                </label>
                <input
                  type="number"
                  value={filters. minPrice}
                  onChange={(e) => setFilters({ ... filters, minPrice: e.target.value })}
                  placeholder="R$ 0"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preço Máximo
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  placeholder="R$ 100"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark: border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark: bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark: text-white"
                >
                  <option value="">Todas</option>
                  <option value="fitness">Fitness</option>
                  <option value="cooking">Culinária</option>
                  <option value="art">Arte</option>
                  <option value="music">Música</option>
                  <option value="other">Outro</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Limpar
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && creators.length === 0 ?  (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhum criador encontrado
        </div>
      ) : (
        <>
          {/* Creators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creators. map((creator, index) => (
              <div
                key={creator.id}
                ref={index === creators.length - 1 ? lastCreatorRef : null}
              >
                <CreatorCard
                  creator={creator}
                  onSubscribe={handleSubscribe}
                />
              </div>
            ))}
          </div>

          {/* Loading More */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;