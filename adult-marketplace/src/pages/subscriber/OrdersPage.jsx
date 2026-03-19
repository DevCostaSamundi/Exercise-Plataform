// pages/subscriber/OrdersPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/marketplaceService';

const STATUS_CONFIG = {
  PENDING:            { label: 'Aguarda pagamento', color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-800',           icon: '⏳' },
  CONFIRMED:          { label: 'A preparar',         color: 'text-blue-700',    bg: 'bg-blue-100 dark:bg-blue-900/30',           icon: '🔄' },
  PROCESSING:         { label: 'A preparar',         color: 'text-blue-700',    bg: 'bg-blue-100 dark:bg-blue-900/30',           icon: '🔄' },
  SHIPPED:            { label: 'Enviado',             color: 'text-indigo-700',  bg: 'bg-indigo-100 dark:bg-indigo-900/30',       icon: '📦' },
  AWAITING_APPROVAL:  { label: 'Confirmar recepção', color: 'text-violet-700',  bg: 'bg-violet-100 dark:bg-violet-900/30',       icon: '👁️' },
  COMPLETED:          { label: 'Concluído',           color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30',     icon: '✅' },
  DISPUTED:           { label: 'Em disputa',          color: 'text-rose-700',    bg: 'bg-rose-100 dark:bg-rose-900/30',           icon: '⚠️' },
  CANCELLED:          { label: 'Cancelado',           color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-800',            icon: '✕' },
  REFUNDED:           { label: 'Reembolsado',         color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-800',            icon: '↩️' },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [approving,    setApproving]    = useState(null);
  const [disputing,    setDisputing]    = useState(null);
  const [disputeForm,  setDisputeForm]  = useState({ reason: '', evidence: {} });

  useEffect(() => { loadOrders(); }, [statusFilter]);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await orderService.getMyOrders({ status: statusFilter || undefined });
      if (res.success) setOrders(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(orderId) {
    setApproving(orderId);
    try {
      await orderService.approveDelivery(orderId);
      setOrders(os => os.map(o => o.id === orderId ? { ...o, status: 'COMPLETED' } : o));
    } finally {
      setApproving(null);
    }
  }

  async function handleDispute() {
    if (!disputing || !disputeForm.reason.trim()) return;
    try {
      await orderService.openDispute(disputing, disputeForm);
      setOrders(os => os.map(o => o.id === disputing ? { ...o, status: 'DISPUTED', isDisputed: true } : o));
      setDisputing(null);
      setDisputeForm({ reason: '', evidence: {} });
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao abrir disputa.');
    }
  }

  const filters = [
    { value: '',                  label: 'Todos' },
    { value: 'CONFIRMED',         label: 'A preparar' },
    { value: 'AWAITING_APPROVAL', label: 'Para confirmar' },
    { value: 'COMPLETED',         label: 'Concluídos' },
    { value: 'DISPUTED',          label: 'Disputas' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
              </svg>
            </button>
            <h1 className="font-bold text-slate-900 dark:text-white">Os meus pedidos</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Filtros */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">🛍️</div>
            <p className="font-medium text-slate-600 dark:text-slate-400">Sem pedidos ainda</p>
            <p className="text-sm text-slate-500 mt-1 mb-6">Explora a loja das tuas criadoras favoritas.</p>
            <button
              onClick={() => navigate('/explore')}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-semibold text-sm"
            >
              Explorar marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                          #{order.orderNumber}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    {/* Produtos */}
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 mb-2">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                            🛍️
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {item.quantity}× {item.product?.name || 'Produto'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.product?.creator?.displayName}
                            {' · '}
                            ${Number(item.price).toFixed(2)} USDC
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Tracking */}
                    {order.shipment?.trackingCode && (
                      <div className="mt-2 p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          📦 Rastreio: <span className="font-mono">{order.shipment.trackingCode}</span>
                          {order.shipment.carrier && ` · ${order.shipment.carrier}`}
                        </p>
                      </div>
                    )}

                    {/* Delivery file */}
                    {order.deliveryFileUrl && order.status === 'AWAITING_APPROVAL' && (
                      <div className="mt-2 p-2.5 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-between">
                        <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">
                          ✅ Conteúdo disponível para download
                        </p>
                        <a
                          href={order.deliveryFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-violet-700 dark:text-violet-300 underline"
                        >
                          Aceder →
                        </a>
                      </div>
                    )}

                    {/* Escrow auto-release */}
                    {order.escrow?.autoReleaseAt && order.status === 'AWAITING_APPROVAL' && (
                      <p className="text-xs text-slate-500 mt-2">
                        ⏱ Pagamento liberado automaticamente em {new Date(order.escrow.autoReleaseAt).toLocaleString('pt-BR')}
                      </p>
                    )}

                    {/* Acções — Aprovar / Disputar */}
                    {order.status === 'AWAITING_APPROVAL' && !order.isDisputed && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApprove(order.id)}
                          disabled={approving === order.id}
                          className="flex-1 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {approving === order.id ? 'A confirmar...' : '✅ Confirmar recepção'}
                        </button>
                        <button
                          onClick={() => setDisputing(order.id)}
                          className="px-4 py-2.5 border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        >
                          ⚠️ Disputar
                        </button>
                      </div>
                    )}

                    {order.status === 'DISPUTED' && (
                      <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                        <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
                          Disputa em análise — resolução em até 5 dias úteis.
                        </p>
                        {order.disputeReason && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{order.disputeReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Disputa */}
      {disputing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDisputing(null)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white">Abrir disputa</h3>
            <p className="text-sm text-slate-500">
              Descreve o problema com este pedido. A plataforma irá analisar e resolver em até 5 dias úteis.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Motivo *
              </label>
              <textarea
                value={disputeForm.reason}
                onChange={e => setDisputeForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="ex: Recebi o item danificado / Não recebi o conteúdo..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none outline-none focus:border-black dark:focus:border-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDisputing(null)}
                className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDispute}
                disabled={!disputeForm.reason.trim()}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-rose-700 transition-colors"
              >
                Abrir disputa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}