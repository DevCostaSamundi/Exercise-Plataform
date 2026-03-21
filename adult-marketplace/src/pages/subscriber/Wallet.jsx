import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import walletService from '../../services/walletService'; // USAR SERVIÇO
import { formatCurrency } from '../../utils/formatters';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCreditCard,
  FiPieChart,
} from 'react-icons/fi';

const Wallet = () => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchWallet();
  }, [period]);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const response = await walletService.getWallet({ period });
      setWalletData(response);
    } catch (err) {
      console.error('Erro ao buscar carteira:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = walletData?.stats || {};
  const breakdown = walletData?.breakdown || {};
  const recentTransactions = walletData?.recentTransactions || [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiDollarSign className="text-3xl text-slate-800" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Carteira
            </h1>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {[
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mês' },
              { value: 'year', label: 'Ano' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  period === option.value
                    ? 'bg-slate-800 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Spent */}
        <div className="bg-black text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FiDollarSign className="text-4xl opacity-80" />
          </div>
          <h3 className="text-3xl font-bold mb-1">
            {formatCurrency(stats.totalSpent || 0)}
          </h3>
          <p className="text-sm text-white/80">Total gasto no período</p>
        </div>

        {/* Transaction Count */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <FiCreditCard className="text-4xl text-black" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.transactionCount || 0}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Transações realizadas
          </p>
        </div>

        {/* Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <FiPieChart className="text-4xl text-black" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Distribuição
          </h3>
          <div className="space-y-2 text-sm">
            {Object.entries(breakdown).map(([type, amount]) => (
              <div key={type} className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{type}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Transações Recentes
          </h2>
          <Link
            to="/transactions"
            className="text-sm text-black hover:text-black font-medium"
          >
            Ver todas →
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black dark:bg-black/20 rounded-full flex items-center justify-center">
                    <FiDollarSign className="text-black" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Nenhuma transação ainda
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;