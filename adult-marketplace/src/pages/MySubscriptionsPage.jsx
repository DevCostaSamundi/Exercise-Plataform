// src/pages/MySubscriptionsPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import subscriptionService from '../services/subscriptionService';
import { formatCurrency } from '../config/constants';

export default function MySubscriptionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await subscriptionService.getSubscriptions();
      
      if (response.success) {
        setSubscriptions(response.data || []);
      } else {
        setError(response.message || 'Erro ao carregar assinaturas');
      }
    } catch (err) {
      console.error('Erro ao carregar assinaturas:', err);
      setError(err.response?.data?.message || 'Erro ao carregar assinaturas');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!confirm('Deseja realmente cancelar esta assinatura?\n\nVocê manterá acesso até o final do período pago.')) {
      return;
    }

    setCancelling(subscriptionId);

    try {
      const response = await subscriptionService.cancelSubscription(subscriptionId);

      if (response.success) {
        // Atualizar lista localmente
        setSubscriptions(subscriptions.map(sub =>
          sub.id === subscriptionId 
            ? { ...sub, status: 'CANCELLED', autoRenew: false } 
            : sub
        ));

        alert('Assinatura cancelada com sucesso!  ✓\n\nVocê manterá acesso até o final do período pago.');
      } else {
        alert(response.message || 'Erro ao cancelar assinatura');
      }
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err);
      alert(err.response?.data?.message || 'Erro ao cancelar assinatura.  Tente novamente.');
    } finally {
      setCancelling(null);
    }
  };

  const handleReactivateSubscription = async (subscriptionId) => {
    // TODO: Implementar reativação quando backend estiver pronto
    alert('Funcionalidade em desenvolvimento');
  };

  // Calculate total monthly cost
  const totalMonthlyCost = subscriptions
    .filter(sub => sub.status === 'ACTIVE')
    .reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);

  // Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Carregando assinaturas... </p>
          </div>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  📋 Minhas Assinaturas
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Gerencie suas assinaturas ativas e histórico
                </p>
              </div>

              {subscriptions.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Mensal</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(totalMonthlyCost)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Subscriptions List */}
            {subscriptions.length > 0 ?  (
              <div className="space-y-6">
                {/* Active Subscriptions */}
                {subscriptions.filter(sub => sub.status === 'ACTIVE').length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark: text-white mb-4">
                      Assinaturas Ativas
                    </h2>
                    <div className="space-y-4">
                      {subscriptions
                        .filter(sub => sub.status === 'ACTIVE')
                        .map((subscription) => (
                          <SubscriptionCard
                            key={subscription.id}
                            subscription={subscription}
                            onCancel={handleCancelSubscription}
                            cancelling={cancelling === subscription.id}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Cancelled Subscriptions */}
                {subscriptions.filter(sub => sub.status === 'CANCELLED').length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                      Assinaturas Canceladas
                    </h2>
                    <div className="space-y-4">
                      {subscriptions
                        .filter(sub => sub.status === 'CANCELLED')
                        .map((subscription) => (
                          <SubscriptionCard
                            key={subscription.id}
                            subscription={subscription}
                            onReactivate={handleReactivateSubscription}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Expired Subscriptions */}
                {subscriptions.filter(sub => sub.status === 'EXPIRED').length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                      Assinaturas Expiradas
                    </h2>
                    <div className="space-y-4">
                      {subscriptions
                        .filter(sub => sub.status === 'EXPIRED')
                        .map((subscription) => (
                          <SubscriptionCard
                            key={subscription.id}
                            subscription={subscription}
                            onReactivate={handleReactivateSubscription}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Total Summary (Active only) */}
                {subscriptions.filter(sub => sub.status === 'ACTIVE').length > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                          Total de {subscriptions.filter(sub => sub. status === 'ACTIVE').length} assinatura(s) ativa(s)
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Cobrado mensalmente
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          Total mensal: 
                        </p>
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(totalMonthlyCost)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Empty State
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
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
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

// Subscription Card Component
function SubscriptionCard({ subscription, onCancel, onReactivate, cancelling }) {
  const navigate = useNavigate();
  const isCancelled = subscription.status === 'CANCELLED';
  const isExpired = subscription.status === 'EXPIRED';
  const isActive = subscription.status === 'ACTIVE';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month:  'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'ACTIVE':
        return (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
            ✓ Ativa
          </span>
        );
      case 'CANCELLED': 
        return (
          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
            ⏸ Cancelada
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
            ✕ Expirada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border ${
      isActive 
        ? 'border-slate-200 dark:border-slate-800' 
        : 'border-slate-200 dark:border-slate-800 opacity-75'
    } p-6`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Creator Info */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => navigate(`/creator/${subscription.creator?.username || subscription.creatorId}`)}
            className="flex-shrink-0"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold hover:scale-110 transition-transform">
              {subscription.creator?.displayName?.charAt(0) || 'C'}
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate(`/creator/${subscription.creator?.username || subscription.creatorId}`)}
                className="font-bold text-lg text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
              >
                {subscription.creator?.displayName || 'Criador'}
              </button>
              {getStatusBadge()}
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              @{subscription.creator?.username || 'username'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Desde {formatDate(subscription.startDate || subscription.createdAt)}
              </span>

              {subscription.autoRenew && isActive && (
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
              {formatCurrency(subscription.amount || 0)}
              <span className="text-sm font-normal text-slate-500 dark: text-slate-400">/mês</span>
            </p>
            {subscription.endDate && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isCancelled ? 'Expira em' : isExpired ? 'Expirou em' : 'Próximo pagamento:'} {formatDate(subscription.endDate)}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/creator/${subscription.creator?.username || subscription.creatorId}`)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Ver Perfil
            </button>

            {isActive && subscription.autoRenew && (
              <button
                onClick={() => onCancel(subscription.id)}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 hover: bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {cancelling ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Cancelando...</span>
                  </>
                ) : (
                  'Cancelar'
                )}
              </button>
            )}

            {(isCancelled || isExpired) && onReactivate && (
              <button
                onClick={() => onReactivate(subscription.id)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reativar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}