import { useState, useEffect } from 'react';
import transactionService from '../../services/transactionService'; // USAR SERVIÇO
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
    endDate:  '',
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
        limit:  20,
        ... filters,
      });

      const newTransactions = response.transactions || [];

      if (append) {
        setTransactions((prev) => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }

      setHasMore(response.hasMore || false);
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
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transacoes_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao exportar transações');
    }
  };

  const clearFilters = () => {
    setFilters({
      type:  '',
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
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <FiDownload className="text-lg" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              <FiFilter className="text-lg" />
              <span>Filtros</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark: border-gray-700 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark: border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Todos</option>
                  {Object.entries(TRANSACTION_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark: text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark: bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark: text-white"
                >
                  <option value="">Todos</option>
                  {Object.entries(PAYMENT_STATUS).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={filters. startDate}
                  onChange={(e) => setFilters({ ... filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={filters. endDate}
                  onChange={(e) => setFilters({ ... filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      {loading && transactions.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhuma transação encontrada
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                ref={index === transactions.length - 1 ? lastTransactionRef : null}
              >
                <TransactionRow transaction={transaction} />
              </div>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Transactions;