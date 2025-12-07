/**
 * Carteira Digital
 * Visão geral de gastos e saldo
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
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
  const [period, setPeriod] = useState('month'); // 'week', 'month', 'year'

  useEffect(() => {
    fetchWallet();
  }, [period]);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pride_connect_token');
      const response = await axios.get(`${API_BASE_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { period },
      });

      setWalletData(response.data);
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
            <FiDollarSign className="text-3xl text-green-600" />
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
                    ? 'bg-green-600 text-white'
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
        {/* Total Spent This Period */}
        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FiDollarSign className="text-4xl opacity-80" />
            <div className="text-right">
              <p className="text-sm opacity-90">Gasto no Período</p>
              <p className="text-3xl font-bold">
                {formatCurrency(stats.totalSpent || 0)}
              </p>
            </div>
          </div>
          {stats.percentageChange !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {stats.percentageChange >= 0 ? (
                <FiTrendingUp className="text-green-200" />
              ) : (
                <FiTrendingDown className="text-red-200" />
              )}
              <span>
                {Math.abs(stats.percentageChange).toFixed(1)}% vs período anterior
              </span>
            </div>
          )}
        </div>

        {/* Average per Month */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <FiPieChart className="text-4xl text-blue-600" />
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Média Mensal
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.averageMonthly || 0)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Últimos 6 meses
          </p>
        </div>

        {/* Total All Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <FiCreditCard className="text-4xl text-purple-600" />
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Gasto
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalAllTime || 0)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Desde o cadastro
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Spending Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Distribuição de Gastos
          </h3>

          <div className="space-y-4">
            {[
              {
                label: 'Assinaturas',
                amount: breakdown.subscriptions || 0,
                color: 'bg-purple-600',
                icon: '📋',
              },
              {
                label: 'Posts PPV',
                amount: breakdown.ppvPosts || 0,
                color: 'bg-pink-600',
                icon: '🔒',
              },
              {
                label: 'Mensagens PPV',
                amount: breakdown.ppvMessages || 0,
                color: 'bg-blue-600',
                icon: '💬',
              },
              {
                label: 'Gorjetas',
                amount: breakdown.tips || 0,
                color: 'bg-yellow-600',
                icon: '💰',
              },
            ].map((item) => {
              const total = stats.totalSpent || 1;
              const percentage = ((item.amount / total) * 100). toFixed(1);

              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{percentage}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Creators */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Criadores com Maior Gasto
          </h3>

          <div className="space-y-3">
            {walletData?.topCreators?.slice(0, 5).map((creator, index) => (
              <Link
                key={creator._id}
                to={`/creator/${creator.username}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-400">
                  #{index + 1}
                </div>
                <img
                  src={creator.avatar || '/default-avatar.png'}
                  alt={creator.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {creator.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{creator.username}
                  </p>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(creator.totalSpent)}
                </p>
              </Link>
            )) || (
              <p className="text-center text-gray-500 py-8">
                Nenhum gasto ainda
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Transações Recentes
          </h3>
          <Link
            to="/transactions"
            className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
          >
            Ver Todas
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Nenhuma transação recente
          </p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <FiDollarSign className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/transactions"
          className="flex items-center justify-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
        >
          <FiCreditCard className="text-xl text-purple-600" />
          <span className="font-semibold text-purple-600">
            Ver Histórico Completo
          </span>
        </Link>

        <Link
          to="/settings? tab=payments"
          className="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <FiCreditCard className="text-xl text-blue-600" />
          <span className="font-semibold text-blue-600">
            Métodos de Pagamento
          </span>
        </Link>

        <Link
          to="/subscriptions"
          className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
        >
          <FiPieChart className="text-xl text-green-600" />
          <span className="font-semibold text-green-600">
            Gerenciar Assinaturas
          </span>
        </Link>
      </div>
    </div>
  );
};

export default Wallet;