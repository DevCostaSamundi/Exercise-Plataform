// pages/Creator/CreatorStorePage.jsx
// Dashboard da criadora para gerir a loja: produtos, avaliações, perfil da loja.

import { useState, useEffect } from 'react';
import CreatorSidebar from '../../components/CreatorSidebar';
import ProductFormModal from '../../components/store/ProductFormModal';
import marketplaceService from '../../services/marketplaceService';

const TABS = ['Produtos', 'Avaliações', 'Configurações'];

const STATUS_BADGES = {
  ACTIVE:    { label: 'Activa',     color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  WARNING:   { label: '⚠️ Aviso',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  SUSPENDED: { label: '🚫 Suspensa', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  BANNED:    { label: 'Banida',     color: 'bg-slate-200 text-slate-600' },
  PAUSED:    { label: 'Pausada',    color: 'bg-slate-100 text-slate-600' },
};

export default function CreatorStorePage() {
  const [activeTab,     setActiveTab]     = useState('Produtos');
  const [products,      setProducts]      = useState([]);
  const [reviews,       setReviews]       = useState([]);
  const [storeProfile,  setStoreProfile]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [editProduct,   setEditProduct]   = useState(null);
  const [filterActive,  setFilterActive]  = useState('all');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [prodRes, profileRes] = await Promise.all([
        marketplaceService.getMyProducts({ limit: 50 }),
        marketplaceService.getMyStoreProfile(),
      ]);
      if (prodRes.success)    setProducts(prodRes.data);
      if (profileRes.success) setStoreProfile(profileRes.data);
    } catch {}
    setLoading(false);
  }

  async function loadReviews() {
    const res = await marketplaceService.getMyReviews({ limit: 50 });
    if (res.success) setReviews(res.data);
  }

  useEffect(() => {
    if (activeTab === 'Avaliações') loadReviews();
  }, [activeTab]);

  async function handleToggleActive(product) {
    await marketplaceService.updateProduct(product.id, { isActive: !product.isActive });
    setProducts(ps => ps.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
  }

  async function handleDelete(productId) {
    if (!confirm('Remover produto da loja?')) return;
    await marketplaceService.deleteProduct(productId);
    setProducts(ps => ps.filter(p => p.id !== productId));
  }

  const filteredProducts = products.filter(p => {
    if (filterActive === 'active')   return p.isActive;
    if (filterActive === 'inactive') return !p.isActive;
    return true;
  });

  const status     = storeProfile?.storeStatus || 'ACTIVE';
  const badge      = STATUS_BADGES[status];
  const negCount   = storeProfile?.negativeReviewCount || 0;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <CreatorSidebar />

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">A minha loja</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Gere os teus produtos, avaliações e configurações.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badge */}
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${badge.color}`}>
              {badge.label}
            </span>

            <button
              onClick={() => { setEditProduct(null); setShowForm(true); }}
              className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Novo produto
            </button>
          </div>
        </div>

        {/* Alertas de moderação */}
        {status === 'WARNING' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">Aviso de moderação</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                A tua loja recebeu {negCount} avaliações negativas (1–2 estrelas). Ao atingir 10, será suspensa automaticamente. Responde às avaliações e melhora a qualidade dos produtos.
              </p>
            </div>
          </div>
        )}
        {status === 'SUSPENDED' && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl">🚫</span>
            <div>
              <p className="font-semibold text-rose-800 dark:text-rose-300">Loja suspensa</p>
              <p className="text-sm text-rose-700 dark:text-rose-400 mt-0.5">
                A tua loja foi suspensa por excesso de avaliações negativas. Podes contestar a suspensão em até 7 dias através do suporte.
              </p>
              <a href="/support" className="text-sm font-semibold text-rose-700 dark:text-rose-400 underline mt-2 inline-block">
                Contestar suspensão →
              </a>
            </div>
          </div>
        )}

        {/* Estatísticas rápidas */}
        {storeProfile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total vendas',     value: storeProfile.totalSales,         icon: '💰' },
              { label: 'Avaliação média',  value: `${Number(storeProfile.storeRating || 0).toFixed(1)} ⭐`, icon: '⭐' },
              { label: 'Avaliações',       value: storeProfile.totalReviews,       icon: '💬' },
              { label: 'Neg. (meta ≤10)',  value: `${negCount}/10`,                icon: negCount >= 8 ? '🔴' : negCount >= 5 ? '🟡' : '🟢' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.icon} {s.label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-6">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {tab}
                {tab === 'Produtos' && ` (${products.length})`}
                {tab === 'Avaliações' && storeProfile?.totalReviews ? ` (${storeProfile.totalReviews})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* ─── TAB: Produtos ─────────────────────────────────── */}
        {activeTab === 'Produtos' && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex items-center gap-2">
              {[['all', 'Todos'], ['active', 'Activos'], ['inactive', 'Inativos']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilterActive(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterActive === v
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-5xl mb-4">🛍️</div>
                <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">Ainda não tens produtos</p>
                <p className="text-sm text-slate-500 mb-6">Cria o teu primeiro produto e começa a vender.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Criar primeiro produto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <CreatorProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => { setEditProduct(product); setShowForm(true); }}
                    onToggle={() => handleToggleActive(product)}
                    onDelete={() => handleDelete(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: Avaliações ───────────────────────────────── */}
        {activeTab === 'Avaliações' && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl mb-3">⭐</div>
                <p className="text-slate-500">Ainda não tens avaliações.</p>
              </div>
            ) : (
              reviews.map(review => (
                <div
                  key={review.id}
                  className={`bg-white dark:bg-slate-900 rounded-xl border p-4 ${
                    review.isNegative
                      ? 'border-rose-200 dark:border-rose-800'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={review.buyer?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${review.buyer?.username}`}
                        alt={review.buyer?.username}
                        className="w-9 h-9 rounded-full object-cover bg-slate-200"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          @{review.buyer?.username}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < review.rating ? 'text-amber-400' : 'text-slate-300'}`}>★</span>
                      ))}
                    </div>
                  </div>

                  {review.product && (
                    <p className="text-xs text-slate-500 mt-2">
                      Produto: <span className="font-medium">{review.product.name}</span>
                    </p>
                  )}

                  {review.comment && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                      "{review.comment}"
                    </p>
                  )}

                  {review.isNegative && (
                    <p className="text-xs text-rose-500 mt-2 font-medium">
                      ⚠️ Avaliação negativa — conta para o limite de 10
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TAB: Configurações ────────────────────────────── */}
        {activeTab === 'Configurações' && storeProfile && (
          <StoreSettingsForm profile={storeProfile} onSave={setStoreProfile} />
        )}
      </main>

      {/* Modal */}
      <ProductFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditProduct(null); }}
        onSuccess={(product) => {
          if (editProduct) {
            setProducts(ps => ps.map(p => p.id === product.id ? product : p));
          } else {
            setProducts(ps => [product, ...ps]);
          }
          setShowForm(false);
          setEditProduct(null);
        }}
        editProduct={editProduct}
      />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function CreatorProductCard({ product, onEdit, onToggle, onDelete }) {
  const image = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0] : null;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden ${
      product.isActive
        ? 'border-slate-200 dark:border-slate-800'
        : 'border-dashed border-slate-300 dark:border-slate-700 opacity-60'
    }`}>
      {/* Imagem */}
      <div className="relative h-36 bg-slate-100 dark:bg-slate-800">
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-slate-400">🖼️</div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {product.nftEnabled && (
            <span className="bg-violet-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">NFT</span>
          )}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
            product.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
          }`}>
            {product.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{product.name}</p>
          <p className="text-base font-bold text-slate-900 dark:text-white">
            ${parseFloat(product.price).toFixed(2)} <span className="text-xs font-normal text-slate-500">USDC</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{product._count?.orderItems || 0} vendidos</span>
          <span>·</span>
          <span>{product._count?.storeReviews || 0} avaliações</span>
          {!product.isUnlimited && product.stock !== null && (
            <>
              <span>·</span>
              <span className={product.stock <= 2 ? 'text-rose-500 font-medium' : ''}>
                {product.stock} em stock
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onEdit}
            className="flex-1 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onToggle}
            className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {product.isActive ? 'Desactivar' : 'Activar'}
          </button>
          <button
            onClick={onDelete}
            className="py-1.5 px-2 rounded-lg text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function StoreSettingsForm({ profile, onSave }) {
  const [form, setForm] = useState({
    storeDisplayName:    profile.storeDisplayName || '',
    storeBio:            profile.storeBio || '',
    shipsFrom:           profile.shipsFrom || '',
    shipsInternationally: profile.shipsInternationally || false,
    defaultDeliveryDays: profile.defaultDeliveryDays || 7,
    acceptsCustom:       profile.acceptsCustom !== false,
    acceptsPhysical:     profile.acceptsPhysical !== false,
    acceptsDigital:      profile.acceptsDigital !== false,
    acceptsServices:     profile.acceptsServices !== false,
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await marketplaceService.updateMyStoreProfile(form);
      if (res.success) {
        onSave(res.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Nome da loja
        </label>
        <input
          value={form.storeDisplayName}
          onChange={e => set('storeDisplayName', e.target.value)}
          placeholder="ex: Loja da Sofia ✨"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Descrição da loja
        </label>
        <textarea
          value={form.storeBio}
          onChange={e => set('storeBio', e.target.value)}
          rows={3}
          placeholder="Apresenta a tua loja..."
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none resize-none focus:border-black dark:focus:border-white transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Tipos de produto aceites
        </label>
        <div className="space-y-2">
          {[
            ['acceptsDigital',  '📲 Digital'],
            ['acceptsCustom',   '🎨 Custom'],
            ['acceptsPhysical', '📦 Físico'],
            ['acceptsServices', '🎥 Serviços'],
          ].map(([field, label]) => (
            <label key={field} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form[field]}
                onChange={e => set(field, e.target.checked)}
                className="accent-black w-4 h-4"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          País/região de origem (para envios físicos)
        </label>
        <input
          value={form.shipsFrom}
          onChange={e => set('shipsFrom', e.target.value)}
          placeholder="ex: Portugal"
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? 'A guardar...' : saved ? '✓ Guardado!' : 'Guardar alterações'}
      </button>
    </div>
  );
}