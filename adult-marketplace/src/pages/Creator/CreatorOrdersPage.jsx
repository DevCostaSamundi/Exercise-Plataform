// pages/Creator/CreatorOrdersPage.jsx
import { useState, useEffect } from 'react';
import CreatorSidebar from '../../components/CreatorSidebar';
import orderService from '../../services/orderService';
import ShippingLabelButton from '../../components/store/ShippingLabelButton';

const STATUS_CONFIG = {
  PENDING:            { label: 'Aguarda pagamento', color: 'bg-slate-100 text-slate-600', icon: '⏳' },
  CONFIRMED:          { label: 'Confirmar e preparar', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '✅' },
  PROCESSING:         { label: 'Em preparação', color: 'bg-amber-100 text-amber-700', icon: '🔄' },
  SHIPPED:            { label: 'Enviado', color: 'bg-indigo-100 text-indigo-700', icon: '📦' },
  AWAITING_APPROVAL:  { label: 'Aguarda aprovação', color: 'bg-violet-100 text-violet-700', icon: '👁️' },
  COMPLETED:          { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  DISPUTED:           { label: '⚠️ Disputa', color: 'bg-rose-100 text-rose-700', icon: '⚠️' },
  CANCELLED:          { label: 'Cancelado', color: 'bg-slate-100 text-slate-500', icon: '✕' },
  REFUNDED:           { label: 'Reembolsado', color: 'bg-slate-100 text-slate-500', icon: '↩️' },
};

const STATUS_FILTERS = [
  { value: '',                  label: 'Todos' },
  { value: 'CONFIRMED',         label: 'A preparar' },
  { value: 'AWAITING_APPROVAL', label: 'Aguarda aprovação' },
  { value: 'COMPLETED',         label: 'Concluídos' },
  { value: 'DISPUTED',          label: 'Disputas' },
];

export default function CreatorOrdersPage() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [statusFilter,  setStatusFilter]  = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await orderService.getCreatorOrders({
        status: statusFilter || undefined,
        limit: 50,
      });
      if (res.success) setOrders(res.data);
    } catch {}
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <CreatorSidebar />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pedidos recebidos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Gere todos os pedidos da tua loja.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-500">Sem pedidos neste filtro.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <OrderRow
                key={order.id}
                order={order}
                onSelect={() => setSelectedOrder(order)}
                onDelivered={loadOrders}
              />
            ))}
          </div>
        )}
      </main>

      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onDelivered={() => { loadOrders(); setSelectedOrder(null); }}
        />
      )}
    </div>
  );
}

// ── OrderRow ─────────────────────────────────────────────

function OrderRow({ order, onSelect, onDelivered }) {
  const [deliveryUrl,  setDeliveryUrl]  = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier,      setCarrier]      = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [showDeliver,  setShowDeliver]  = useState(false);

  const cfg    = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const isPhys = order.items?.some(i => i.product?.type === 'PHYSICAL' || i.product?.type === 'HYBRID');
  const canDeliver = ['CONFIRMED', 'PROCESSING'].includes(order.status);

  async function handleDeliver() {
    setSubmitting(true);
    try {
      await orderService.markAsDelivered(order.id, {
        deliveryFileUrl: isPhys ? undefined : deliveryUrl,
        trackingCode:    isPhys ? trackingCode : undefined,
        carrier:         isPhys ? carrier : undefined,
      });
      onDelivered();
    } finally {
      setSubmitting(false);
      setShowDeliver(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              #{order.orderNumber}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
            {order.anonDropCode && (
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                📦 {order.anonDropCode}
              </span>
            )}
          </div>

          {/* Produtos */}
          <div className="space-y-1 mb-2">
            {order.items?.map((item, i) => (
              <p key={i} className="text-sm text-slate-700 dark:text-slate-300">
                {item.quantity}× {item.product?.name || 'Produto'}
              </p>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>${Number(order.total || 0).toFixed(2)} USDC</span>
            <span>·</span>
            <span>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
            {order.escrow && (
              <>
                <span>·</span>
                <span>Escrow: {order.escrow.status}</span>
              </>
            )}
          </div>

          {/* Release timer */}
          {order.escrow?.autoReleaseAt && order.status === 'AWAITING_APPROVAL' && (
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 font-medium">
              ⏱ Auto-release em {getRemainingTime(order.escrow.autoReleaseAt)}
            </p>
          )}

          {/* Instruções do fa */}
          {order.buyerInstructions && (
            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-500 mb-0.5">Instruções do fa:</p>
              <p className="text-xs text-slate-700 dark:text-slate-300">{order.buyerInstructions}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {canDeliver && (
            <button
              onClick={() => setShowDeliver(!showDeliver)}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {isPhys ? '📦 Inserir rastreio' : '✅ Marcar entregue'}
            </button>
          )}
          {/* Etiqueta PDF — só para físicos, após confirmação do pedido */}
          {isPhys && ['CONFIRMED','PROCESSING','SHIPPED','AWAITING_APPROVAL','COMPLETED'].includes(order.status) && (
            <ShippingLabelButton
              orderId={order.id}
              orderNumber={order.orderNumber}
            />
          )}
          <button
            onClick={onSelect}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Ver detalhe
          </button>
        </div>
      </div>

      {/* Delivery form */}
      {showDeliver && canDeliver && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 space-y-3">
          {isPhys ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Código de rastreio *
                  </label>
                  <input
                    value={trackingCode}
                    onChange={e => setTrackingCode(e.target.value)}
                    placeholder="PT123456789"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:border-black dark:focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Transportadora
                  </label>
                  <input
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    placeholder="CTT, DHL, ..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:border-black dark:focus:border-white"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                URL do conteúdo entregue (Arweave ou link seguro)
              </label>
              <input
                value={deliveryUrl}
                onChange={e => setDeliveryUrl(e.target.value)}
                placeholder="https://arweave.net/..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:border-black dark:focus:border-white"
              />
            </div>
          )}

          <button
            onClick={handleDeliver}
            disabled={submitting || (isPhys && !trackingCode)}
            className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {submitting ? 'A confirmar...' : 'Confirmar entrega'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── OrderDetailPanel ──────────────────────────────────────

function OrderDetailPanel({ order, onClose, onDelivered }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Pedido #{order.orderNumber}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {/* Escrow */}
          {order.escrow && (
            <InfoBlock label="Escrow">
              <p className="text-sm">Status: <span className="font-medium">{order.escrow.status}</span></p>
              <p className="text-sm">Valor net: <span className="font-medium">${Number(order.escrow.creatorNet || 0).toFixed(2)} USDC</span></p>
              {order.escrow.autoReleaseAt && (
                <p className="text-sm text-violet-600 dark:text-violet-400">
                  Auto-release: {new Date(order.escrow.autoReleaseAt).toLocaleString('pt-BR')}
                </p>
              )}
            </InfoBlock>
          )}

          {/* Código de drop */}
          {order.anonDropCode && (
            <InfoBlock label="Código de envio anónimo">
              <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                {order.anonDropCode}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Usa este código como referência no envio. Nunca recebes o endereço real do comprador.
              </p>
            </InfoBlock>
          )}

          {/* Instruções */}
          {order.buyerInstructions && (
            <InfoBlock label="Instruções do fa">
              <p className="text-sm text-slate-700 dark:text-slate-300">{order.buyerInstructions}</p>
            </InfoBlock>
          )}

          {/* Envio */}
          {order.shipment && (
            <InfoBlock label="Envio">
              <p className="text-sm">Status: {order.shipment.status}</p>
              {order.shipment.trackingCode && (
                <p className="text-sm">Rastreio: <span className="font-mono font-bold">{order.shipment.trackingCode}</span></p>
              )}
            </InfoBlock>
          )}

          {/* Disputa */}
          {order.isDisputed && (
            <InfoBlock label="⚠️ Disputa aberta" className="border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20">
              <p className="text-sm text-rose-700 dark:text-rose-400">{order.disputeReason}</p>
              <p className="text-xs text-slate-500 mt-1">
                Aberta em {new Date(order.disputeOpenedAt).toLocaleDateString('pt-BR')}
              </p>
            </InfoBlock>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-800 p-4 ${className}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  );
}

function getRemainingTime(dateStr) {
  const ms   = new Date(dateStr) - new Date();
  if (ms <= 0) return 'Iminente';
  const h    = Math.floor(ms / 3600000);
  const m    = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}