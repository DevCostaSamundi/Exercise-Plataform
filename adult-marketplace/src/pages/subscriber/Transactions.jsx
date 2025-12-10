/**
 * Histórico de Transações
 * Lista completa de todas as transações
 */

import { useState, useEffect } from 'react';
import transactionService from '../../services/transactionService';
import { TRANSACTION_TYPES, PAYMENT_STATUS } from '../../config/constants';
import TransactionRow from '../../components/subscriber/TransactionRow';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { FiFilter, FiDownload, FiX } from 'react-icons/fi';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const lastTransactionRef = useInfiniteScroll(loadMore, hasMore, loading);

  useEffect(() => {
    fetchTransactions(1, false);
  }, [filters]);

  const fetchTransactions = async (pageNum, append = true) => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactions({
        page: pageNum,
        limit: 20,
        ...filters,
      });

      const newTransactions = response.data || [];
      const more = response.pagination?.page < response.pagination?.pages;

      if (append) {
        setTransactions((prev) => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }

      setHasMore(more);
      setPage(pageNum);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
    } finally {
      setLoading(false);
    }
  };

  function loadMore() {
    if (!loading && hasMore) {
      fetchTransactions(page + 1, true);
    }
  }

  const handleExportCSV = async () => {
    try {
      const blob = await transactionService.exportTransactions(filters);

      // Download file
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transacoes_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao exportar transações');
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      startDate: '',
      endDate: '',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Histórico de Transações
          </h1>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              <FiDownload />
              Exportar CSV
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiFilter />
              Filtros
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700 mb-4">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Todos</option>
                  <option value={TRANSACTION_TYPES.SUBSCRIPTION}>Assinatura</option>
                  <option value={TRANSACTION_TYPES.PPV_POST}>Post PPV</option>
                  <option value={TRANSACTION_TYPES.PPV_MESSAGE}>Mensagem PPV</option>
                  <option value={TRANSACTION_TYPES.TIP}>Gorjeta</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Todos</option>
                  <option value={PAYMENT_STATUS.COMPLETED}>Concluído</option>
                  <option value={PAYMENT_STATUS.PENDING}>Pendente</option>
                  <option value={PAYMENT_STATUS.FAILED}>Falhou</option>
                  <option value={PAYMENT_STATUS.REFUNDED}>Reembolsado</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={filters. endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowFilters(false)}
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
      </div>

      {/* Transactions List */}
      {loading && transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhuma transação encontrada</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {transactions.map((transaction, index) => {
              const isLast = index === transactions.length - 1;
              return (
                <div key={transaction._id} ref={isLast ? lastTransactionRef : null}>
                  <TransactionRow transaction={transaction} />
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {! hasMore && transactions.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              Todas as transações foram carregadas
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Transactions;