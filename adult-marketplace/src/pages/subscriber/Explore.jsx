/**
 * Página de Exploração
 * Descobrir novos criadores
 */

import { useState, useEffect } from 'react';
import api from '../../services/api';
import subscriptionService from '../../services/subscriptionService';
import { SORT_OPTIONS } from '../../config/constants';
import CreatorCard from '../../components/subscriber/CreatorCard';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { FiSliders, FiX } from 'react-icons/fi';

const Explore = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const lastCreatorRef = useInfiniteScroll(loadMore, hasMore, loading);

  useEffect(() => {
    fetchCreators(1, false);
  }, [sortBy, filters]);

  const fetchCreators = async (pageNum, append = true) => {
    try {
      setLoading(true);

      const response = await api.get('/creators', {
        params: {
          page: pageNum,
          limit: 20,
          sort: sortBy,
          verified: filters.verified || undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          category: filters.category || undefined,
        },
      });

      const newCreators = response.data.data || [];
      const more = response.data.pagination?.page < response.data.pagination?.pages;

      if (append) {
        setCreators((prev) => [...prev, ...newCreators]);
      } else {
        setCreators(newCreators);
      }

      setHasMore(more);
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
        await subscriptionService.createSubscription(creatorId);
      } else {
        // Find subscription by creatorId first
        const subs = await subscriptionService.getUserSubscriptions();
        const subscription = subs.data?.find(s => s.creator.id === creatorId);
        if (subscription) {
          await subscriptionService.cancelSubscription(subscription.id);
        }
      }
    } catch (err) {
      console.error('Erro ao gerenciar assinatura:', err);
      throw err;
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchCreators(1, false);
  };

  const clearFilters = () => {
    setFilters({
      verified: false,
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
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiSliders />
            Filtros
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: SORT_OPTIONS.POPULAR, label: 'Populares' },
            { value: SORT_OPTIONS.RECENT, label: 'Novos' },
            { value: SORT_OPTIONS.PRICE_LOW, label: 'Menor Preço' },
            { value: SORT_OPTIONS.PRICE_HIGH, label: 'Maior Preço' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                sortBy === option.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Filtros Avançados
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FiX />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Verified Only */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) =>
                  setFilters({ ...filters, verified: e.target.checked })
                }
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-gray-900 dark:text-white">
                Apenas Verificados
              </span>
            </label>

            {/* Price Range */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Preço mín"
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters({ ...filters, minPrice: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="Preço máx"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={applyFilters}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map((creator, index) => {
          const isLast = index === creators.length - 1;
          return (
            <div key={creator._id} ref={isLast ? lastCreatorRef : null}>
              <CreatorCard creator={creator} onSubscribe={handleSubscribe} />
            </div>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* No More */}
      {!hasMore && creators.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          Você viu todos os criadores disponíveis! 
        </div>
      )}

      {/* Empty State */}
      {creators.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum criador encontrado com esses filtros.</p>
        </div>
      )}
    </div>
  );
};

export default Explore;