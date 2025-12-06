import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';
import WithdrawalModal from '../../components/WithdrawalModal';
import withdrawalService from '../../services/withdrawalService';
import paymentService from '../../services/paymentService';

export default function CreatorEarningsPage() {
  const [balance, setBalance] = useState(null);
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, payments, withdrawals
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [stats, setStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    subscribers: 0,
    ppvSales: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBalance(),
        fetchPayments(),
        fetchWithdrawals(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await withdrawalService.getBalance();
      setBalance(response.data);
      setStats(prev => ({
        ...prev,
        thisMonth: response.data.monthlyEarnings,
      }));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await paymentService.getUserPayments({
        limit: 50,
        status: 'COMPLETED',
      });
      setPayments(response.data);

      // Calcular estatísticas
      const subscriptions = response.data.filter(p => 
        p.type === 'SUBSCRIPTION' || p.type === 'SUBSCRIPTION_RENEWAL'
      ).length;
      const ppv = response.data.filter(p => 
        p.type === 'PPV_MESSAGE' || p.type === 'PPV_POST'
      ).length;

      setStats(prev => ({
        ...prev,
        subscribers: subscriptions,
        ppvSales: ppv,
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await withdrawalService.getWithdrawals({ limit: 20 });
      setWithdrawals(response.data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const handleWithdrawalSuccess = () => {
    setShowWithdrawalModal(false);
    fetchData();
  };

  const handleCancelWithdrawal = async (withdrawalId) => {
    if (! confirm('Tem certeza que deseja cancelar este saque?')) return;

    try {
      await withdrawalService.cancelWithdrawal(withdrawalId);
      fetchData();
    } catch (error) {
      alert('Erro ao cancelar saque: ' + error.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl. NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentTypeLabel = (type) => {
    const labels = {
      SUBSCRIPTION: 'Assinatura',
      SUBSCRIPTION_RENEWAL: 'Renovação',
      PPV_MESSAGE: 'Mensagem Paga',
      PPV_POST: 'Post Pago',
      TIP: 'Gorjeta',
      WALLET_DEPOSIT: 'Depósito',
    };
    return labels[type] || type;
  };

  const getPaymentTypeIcon = (type) => {
    const icons = {
      SUBSCRIPTION: '👤',
      SUBSCRIPTION_RENEWAL: '🔄',
      PPV_MESSAGE: '💌',
      PPV_POST: '📸',
      TIP: '💰',
      WALLET_DEPOSIT: '💳',
    };
    return icons[type] || '💵';
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { label: 'Pendente', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' },
      PROCESSING: { label: 'Processando', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
      COMPLETED: { label: 'Concluído', color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
      FAILED: { label: 'Falhou', color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
      CANCELLED: { label: 'Cancelado', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400' },
    };
    return badges[status] || badges.PENDING;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
        <CreatorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Carregando ganhos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <CreatorSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <Link
                  to="/creator/dashboard"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    💰 Ganhos & Saques
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Gerencie seus ganhos e pagamentos
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowWithdrawalModal(true)}
                disabled={!balance || balance.availableUSD < 10}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>Sacar</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Available Balance */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <p className="text-indigo-100 text-sm font-medium">Disponível</p>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0-.114-.07-.34-.433-.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0.99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">
                {formatCurrency(balance?.availableUSD || 0)}
              </p>
              <p className="text-indigo-100 text-xs">
                Pronto para saque
              </p>
            </div>

            {/* Pending Balance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Pendente</p>
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101. 415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {formatCurrency(balance?.pendingUSD || 0)}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Em processamento
              </p>
            </div>

            {/* This Month */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Este Mês</p>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {formatCurrency(stats.thisMonth || 0)}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                {balance?.monthlyTransactions || 0} transação(ões)
              </p>
            </div>

            {/* Lifetime Earnings */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total Ganho</p>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {formatCurrency(balance?.lifetimeEarnings || 0)}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Desde o início
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.subscribers}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Assinaturas</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💎</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.ppvSales}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Vendas PPV</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💸</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(balance?.totalWithdrawn || 0)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Sacado</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800">
              <div className="flex space-x-1 p-2">
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === 'payments'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  💰 Recebimentos ({payments.length})
                </button>
                <button
                  onClick={() => setActiveTab('withdrawals')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === 'withdrawals'
                      ?  'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  🏦 Saques ({withdrawals.length})
                </button>
              </div>
            </div>

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {payments.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4">💸</div>
                    <p className="text-slate-600 dark:text-slate-400">Nenhum recebimento ainda</p>
                  </div>
                ) : (
                  payments.map((payment) => (
                    <div key={payment.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">{getPaymentTypeIcon(payment.type)}</div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {getPaymentTypeLabel(payment.type)}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {formatDate(payment.confirmedAt || payment.createdAt)}
                              </p>
                              <span className="text-slate-400">•</span>
                              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                {payment.cryptoCurrency}
                              </span>
                              {payment.txHash && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <a
                                    href={`https://blockchain.com/btc/tx/${payment.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-600 hover:underline"
                                  >
                                    Ver TX
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            +{formatCurrency(payment.netAmount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            de {formatCurrency(payment.amountUSD)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {withdrawals.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4">🏦</div>
                    <p className="text-slate-600 dark:text-slate-400">Nenhum saque realizado</p>
                  </div>
                ) : (
                  withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">🏦</div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                Saque {withdrawal.cryptoCurrency}
                              </p>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${getStatusBadge(withdrawal.status).color}`}>
                                {getStatusBadge(withdrawal.status).label}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {formatDate(withdrawal.createdAt)}
                              </p>
                              {withdrawal.destinationAddress && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-xs text-slate-500 font-mono">
                                    {withdrawal.destinationAddress.substring(0, 10)}...
                                  </span>
                                </>
                              )}
                              {withdrawal.txHash && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <a
                                    href={`https://blockchain.com/btc/tx/${withdrawal.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-600 hover:underline"
                                  >
                                    Ver TX
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center space-x-3">
                          <div>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                              -{formatCurrency(withdrawal.amountUSD)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Líquido: {formatCurrency(withdrawal.netAmount)}
                            </p>
                          </div>
                          {withdrawal.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancelWithdrawal(withdrawal.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Cancelar saque"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          availableBalance={balance?.availableUSD || 0}
          onSuccess={handleWithdrawalSuccess}
        />
      )}
    </div>
  );
}