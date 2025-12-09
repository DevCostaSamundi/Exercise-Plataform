import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency } from '../config/constants';

export default function MySubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/user/subscriptions');
      setSubscriptions(response.data?.data || []);
    } catch (err) {
      console.error('Erro ao carregar assinaturas:', err);
      setError(err.response?.data?.message || 'Erro ao carregar assinaturas');
      
      // Mock data
      setSubscriptions([
        {
          id: 1,
          creator: { username: 'sophiastar', displayName: 'Sophia Star', avatar: null },
          price: 19.99,
          startDate: '2024-01-15',
          nextBilling: '2025-01-15',
          status: 'active',
          autoRenew: true,
        },
        {
          id: 2,
          creator: { username: 'mariaart', displayName: 'Maria Art', avatar: null },
          price: 12.99,
          startDate: '2024-02-20',
          nextBilling: '2025-02-20',
          status: 'active',
          autoRenew: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    if (!confirm('Deseja realmente cancelar esta assinatura?')) return;

    try {
      await api.post(`/subscriptions/${subscriptionId}/cancel`);
      setSubscriptions(subscriptions.map(sub =>
        sub.id === subscriptionId ? { ...sub, autoRenew: false } : sub
      ));
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err);
      alert('Erro ao cancelar assinatura. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1">
          <LoadingSpinner size="lg" message="Carregando assinaturas..." />
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              📋 Minhas Assinaturas
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gerencie suas assinaturas ativas
            </p>
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

            {subscriptions.length > 0 ? (
              <div className="space-y-6">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      {/* Creator Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <Link to={`/creator/${subscription.creator.username}`}>
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 hover:scale-110 transition-transform">
                            {subscription.creator.displayName.charAt(0)}
                          </div>
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/creator/${subscription.creator.username}`}
                            className="font-bold text-lg text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {subscription.creator.displayName}
                          </Link>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            @{subscription.creator.username}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>Desde {new Date(subscription.startDate).toLocaleDateString('pt-BR')}</span>
                            {subscription.autoRenew && (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Renovação automática
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex flex-col md:items-end gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(subscription.price)}
                            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/mês</span>
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Próximo pagamento: {new Date(subscription.nextBilling).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            to={`/creator/${subscription.creator.username}`}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Ver Perfil
                          </Link>
                          {subscription.autoRenew && (
                            <button
                              onClick={() => cancelSubscription(subscription.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                      Total mensal:
                    </span>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(subscriptions.reduce((sum, sub) => sum + sub.price, 0))}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Nenhuma assinatura ativa
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400 mb-6">
                  Explore criadores e assine para ter acesso a conteúdo exclusivo
                </p>
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Explorar Criadores
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
