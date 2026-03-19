// components/store/StoreTab.jsx
// Aba "Loja" visível no perfil público da criadora.
// Mostra produtos, filtros, avaliação da loja.

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import marketplaceService from '../../services/marketplaceService';

const CATEGORY_FILTERS = [
  { value: '',               label: 'Tudo' },
  { value: 'PHYSICAL_ITEM',  label: '📦 Físico' },
  { value: 'DIGITAL_CONTENT',label: '📲 Digital' },
  { value: 'CUSTOM',         label: '🎨 Custom' },
  { value: 'EXPERIENCE',     label: '🎥 Experiências' },
  { value: 'NFT_COLLECTION', label: '✨ NFT' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Mais recente' },
  { value: 'soldCount', label: 'Mais vendido' },
  { value: 'price',     label: 'Menor preço' },
];

export default function StoreTab({ creatorId, onBuyProduct }) {
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [category,    setCategory]    = useState('');
  const [sort,        setSort]        = useState('createdAt');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [storeStatus, setStoreStatus] = useState('ACTIVE');
  const [storeInfo,   setStoreInfo]   = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [creatorId, category, sort, page]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await marketplaceService.getCreatorStore(creatorId, {
        category: category || undefined,
        sort,
        page,
        limit: 12,
      });

      if (res.success) {
        setProducts(res.data);
        setTotalPages(res.meta.totalPages);
        setStoreStatus(res.meta.storeStatus);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  if (storeStatus === 'BANNED') {
    return (
      <div className="py-16 text-center">
        <div className="text-4xl mb-3">🚫</div>
        <p className="text-slate-600 dark:text-slate-400">Esta loja não está disponível.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status da loja */}
      {storeStatus === 'WARNING' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <span>⚠️</span>
          <span>Esta loja tem avaliações negativas em análise.</span>
        </div>
      )}
      {storeStatus === 'SUSPENDED' && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 text-sm text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <span>🚫</span>
          <span>Esta loja está temporariamente suspensa.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setCategory(f.value); setPage(1); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                category === f.value
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ordenação */}
        <select
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1); }}
          className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none rounded-lg px-3 py-1.5 cursor-pointer outline-none"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl mb-3">🛍️</div>
          <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">Sem produtos nesta categoria</p>
          <p className="text-sm text-slate-500">Tenta outro filtro ou volta mais tarde.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={onBuyProduct}
              />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm disabled:opacity-40"
              >
                ←
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}