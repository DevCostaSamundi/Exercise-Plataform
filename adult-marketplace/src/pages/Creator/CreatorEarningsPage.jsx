import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';

// Mock de ganhos por mês (para gráfico/card)
const mockMonthlyEarnings = [
  { month: 'Jan', amount: 18500 },
  { month: 'Fev', amount: 19200 },
  { month: 'Mar', amount: 21300 },
  { month: 'Abr', amount: 22100 },
  { month: 'Mai', amount: 23800 },
  { month: 'Jun', amount: 24940 },
];

// Mock de transações (assinaturas, PPV, tips, saque)
const mockTransactions = [
  {
    id: 1,
    date: '2025-11-21T14:32:00',
    type: 'subscription', // subscription | ppv | tip | payout
    description: 'Assinatura mensal - Maria Silva',
    amount: 24.9,
    status: 'completed',
    method: 'PIX',
  },
  {
    id: 2,
    date: '2025-11-21T10:12:00',
    type: 'ppv',
    description: 'PPV Premium - Vídeo exclusivo',
    amount: 39.9,
    status: 'completed',
    method: 'PIX',
  },
  {
    id: 3,
    date: '2025-11-20T19:05:00',
    type: 'tip',
    description: 'Gorjeta - João Pedro',
    amount: 15,
    status: 'completed',
    method: 'PIX',
  },
  {
    id: 4,
    date: '2025-11-18T16:00:00',
    type: 'payout',
    description: 'Saque para sua conta PIX',
    amount: -500,
    status: 'completed',
    method: 'PIX',
  },
  {
    id: 5,
    date: '2025-11-17T11:30:00',
    type: 'subscription',
    description: 'Assinatura mensal - Ana Costa',
    amount: 24.9,
    status: 'pending',
    method: 'PIX',
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const formatDateTime = (isoString) =>
  new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function CreatorEarningsPage() {
  const [range, setRange] = useState('30d'); // 7d, 30d, 90d, all
  const [typeFilter, setTypeFilter] = useState('all'); // all | subscription | ppv | tip | payout
  const [statusFilter, setStatusFilter] = useState('all'); // all | completed | pending
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totals = useMemo(() => {
    const completed = mockTransactions.filter(
      (t) => t.status === 'completed',
    );
    const gross = completed
      .filter((t) => t.type !== 'payout')
      .reduce((sum, t) => sum + t.amount, 0);
    const payouts = completed
      .filter((t) => t.type === 'payout')
      .reduce((sum, t) => sum + t.amount, 0); // negativo
    const net = gross + payouts;
    const platformFee = gross * 0.2; // exemplo: 20% taxa
    const available = net; // simplificado

    return {
      gross,
      net,
      payouts,
      platformFee,
      available,
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    let list = [...mockTransactions];

    if (typeFilter !== 'all') {
      list = list.filter((t) => t.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }

    // ordenar por data desc
    list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return list;
  }, [typeFilter, statusFilter]);

  const total = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginated = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleRequestPayout = () => {
    // Futuro: chamada de API para solicitar saque
    alert(
      `Solicitação de saque enviada (mock). Valor disponível: ${formatCurrency(
        totals.available,
      )}`,
    );
  };

  const maxAmount = Math.max(
    ...mockMonthlyEarnings.map((m) => m.amount),
    1,
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <CreatorSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header topo */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-xl">P</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">Ganhos</span>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Relatório financeiro da sua conta
                </p>
              </Link>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="all">Todo período</option>
              </select>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Cards principais */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ganhos Brutos
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(totals.gross)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Antes das taxas da plataforma
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Taxas da Plataforma (20%)
              </p>
              <p className="text-2xl font-bold text-amber-500 mt-1">
                {formatCurrency(totals.platformFee)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Valor estimado retido pela PrideConnect
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Valor Líquido
              </p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">
                {formatCurrency(totals.net)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Após taxas + saques
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Disponível para Saque
                </p>
                <p className="text-2xl font-bold text-indigo-500 mt-1">
                  {formatCurrency(totals.available)}
                </p>
              </div>
              <button
                onClick={handleRequestPayout}
                className="mt-3 w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors"
              >
                Solicitar Saque via PIX
              </button>
            </div>
          </section>

          {/* Gráfico simples + resumo */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* "Gráfico" de barras simples */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Ganhos por Mês
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Valores aproximados dos últimos meses
                </span>
              </div>
              <div className="flex items-end justify-between gap-2 h-40">
                {mockMonthlyEarnings.map((item) => {
                  const height = (item.amount / maxAmount) * 100;
                  return (
                    <div
                      key={item.month}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg relative group cursor-pointer"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg" />
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                      <span className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumo de tipos de ganho */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Origem dos Ganhos
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Exemplo de breakdown por tipo de receita. Depois você pode
                trocar pelos dados reais da API.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Assinaturas</span>
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    65%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>PPV Premium</span>
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    25%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Gorjetas</span>
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    10%
                  </span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                🔒 Todos os pagamentos são processados via PIX de forma
                discreta.
              </div>
            </div>
          </section>

          {/* Tabela de transações */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {/* Filtros */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Tipo:
                </span>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'subscription', label: 'Assinaturas' },
                  { value: 'ppv', label: 'PPV' },
                  { value: 'tip', label: 'Gorjetas' },
                  { value: 'payout', label: 'Saques' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setTypeFilter(opt.value);
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-full border ${typeFilter === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Status:
                </span>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'completed', label: 'Concluídos' },
                  { value: 'pending', label: 'Pendentes' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-full border ${statusFilter === opt.value
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista / tabela */}
            {paginated.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma transação encontrada para os filtros atuais.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900/80">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Método
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {paginated.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {formatDateTime(t.date)}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            <TypeBadge type={t.type} />
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {t.description}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${t.amount < 0
                                ? 'text-red-500'
                                : 'text-emerald-500'
                              }`}
                          >
                            {formatCurrency(t.amount)}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {t.method}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={t.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Mostrando{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{' '}
                    –{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, total)}
                    </span>{' '}
                    de <span className="font-medium">{total}</span>{' '}
                    transações
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Anterior
                    </button>
                    <span>
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const map = {
    subscription: {
      label: 'Assinatura',
      className:
        'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    },
    ppv: {
      label: 'PPV',
      className:
        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    },
    tip: {
      label: 'Gorjeta',
      className:
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    },
    payout: {
      label: 'Saque',
      className:
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
  };
  const cfg = map[type] || {
    label: type,
    className:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    completed: {
      label: 'Concluído',
      className:
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    },
    pending: {
      label: 'Pendente',
      className:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    },
  };
  const cfg = map[status] || {
    label: status,
    className:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}