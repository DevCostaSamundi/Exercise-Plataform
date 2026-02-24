/**
 * Página de Assinaturas
 * Gerenciar todas as assinaturas ativas
 */

import { useState, useEffect } from 'react';
import subscriptionService from '../../services/subscriptionService';
import { SUBSCRIPTION_STATUS } from '../../config/constants';
import SubscriptionCard from '../../components/subscriber/SubscriptionCard';
import { FiList, FiFilter } from 'react-icons/fi';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active', 'paused', 'cancelled', 'all'

  useEffect(() => {
    fetchSubscriptions();
  }, [filter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getSubscriptions();
      // Filtrar no frontend se necessário
      let subs = response.subscriptions || response.data || [];
      if (filter !== 'all') {
        subs = subs.filter((sub) => (sub.status || sub.subscriptionStatus) === filter);
      }
      setSubscriptions(subs);
    } catch (err) {
      console.error('Erro ao buscar assinaturas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscriptionId) => {
    try {
      await subscriptionService.cancelSubscription(subscriptionId);
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub._id === subscriptionId
            ? { ...sub, status: SUBSCRIPTION_STATUS.CANCELLED }
            : sub
        )
      );
      alert('Assinatura cancelada com sucesso!');
    } catch (err) {
      console.error('Erro ao cancelar:', err);
      alert(err.response?.data?.message || 'Erro ao cancelar assinatura');
      throw err;
    }
  };

  const handlePause = async (subscriptionId) => {
    try {
      const token = localStorage.getItem('flow_connect_token');
      await axios.put(
        `${API_BASE_URL}/subscriptions/${subscriptionId}/pause`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update list
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub._id === subscriptionId
            ? { ...sub, status: SUBSCRIPTION_STATUS.PAUSED }
            : sub
        )
      );

      alert('Assinatura pausada com sucesso!');
    } catch (err) {
      console.error('Erro ao pausar:', err);
      alert(err.response?.data?.message || 'Erro ao pausar assinatura');
      throw err;
    }
  };

  const filterOptions = [
    { value: 'active', label: 'Ativas', count: subscriptions.filter(s => s.status === 'active').length },
    { value: 'paused', label: 'Pausadas', count: subscriptions.filter(s => s.status === 'paused').length },
    { value: 'cancelled', label: 'Canceladas', count: subscriptions.filter(s => s.status === 'cancelled').length },
    { value: 'all', label: 'Todas', count: subscriptions.length },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiList className="text-3xl text-black" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Minhas Assinaturas
          </h1>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${filter === option.value
                  ? 'bg-black text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {option.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${filter === option.value
                    ? 'bg-white/20'
                    : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subscriptions.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <FiList className="text-5xl text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {filter === 'active'
              ? 'Nenhuma assinatura ativa'
              : filter === 'paused'
                ? 'Nenhuma assinatura pausada'
                : filter === 'cancelled'
                  ? 'Nenhuma assinatura cancelada'
                  : 'Nenhuma assinatura'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Assine criadores para ter acesso a conteúdo exclusivo!
          </p>
          <a
            href="/explore"
            className="inline-block px-6 py-3 bg-black hover:bg-black text-white rounded-lg font-semibold transition-colors"
          >
            Explorar Criadores
          </a>
        </div>
      ) : (
        /* Subscriptions List */
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription._id}
              subscription={subscription}
              onCancel={handleCancel}
              onPause={handlePause}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscriptions;