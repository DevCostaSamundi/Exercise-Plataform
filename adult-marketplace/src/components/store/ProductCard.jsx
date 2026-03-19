// components/store/ProductCard.jsx
import { useNavigate } from 'react-router-dom';

const CATEGORY_LABELS = {
  PHYSICAL_ITEM:   'Físico',
  DIGITAL_CONTENT: 'Digital',
  CUSTOM:          'Custom',
  EXPERIENCE:      'Experiência',
  NFT_COLLECTION:  'NFT',
  BUNDLE:          'Bundle',
  MERCHANDISE:     'Merch',
  OTHER:           'Outro',
};

const TYPE_ICONS = {
  PHYSICAL: '📦',
  DIGITAL:  '📲',
  SERVICE:  '🎥',
  HYBRID:   '✨',
  CUSTOM:   '🎨',
};

function StarsDisplay({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <svg
          key={n}
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3.5 w-3.5 ${n <= Math.round(rating) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      {count !== undefined && (
        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">({count})</span>
      )}
    </div>
  );
}

export default function ProductCard({ product, onClick }) {
  const navigate = useNavigate();

  const image = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : null;

  const isSoldOut = !product.isUnlimited && product.stock !== null && product.stock <= 0;
  const isLimited = product.nftEnabled && product.nftEditionMax;

  const handleClick = () => {
    if (onClick) return onClick(product);
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 hover:-translate-y-0.5 ${isSoldOut ? 'opacity-60' : ''}`}
    >
      {/* Imagem */}
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {TYPE_ICONS[product.type] || '🛍️'}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.nftEnabled && (
            <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              NFT
            </span>
          )}
          {isLimited && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {product.nftEditionMax - product.nftEditionsSold} restantes
            </span>
          )}
          {isSoldOut && (
            <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Esgotado
            </span>
          )}
        </div>

        {/* Tipo */}
        <div className="absolute top-2 right-2">
          <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
            {TYPE_ICONS[product.type]} {CATEGORY_LABELS[product.category] || product.category}
          </span>
        </div>

        {/* Overlay no hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate mb-1">
          {product.name}
        </h3>

        {(product.avgRating !== undefined && product.avgRating > 0) && (
          <div className="mb-1.5">
            <StarsDisplay rating={product.avgRating} count={product.reviewCount} />
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-slate-900 dark:text-white">
            ${parseFloat(product.price).toFixed(2)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">USDC</span>
          </span>
          {product.soldCount > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {product.soldCount} vendidos
            </span>
          )}
        </div>

        {/* Info física */}
        {product.physicalQuestion && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            {product.physicalQuestion.hygieneState === 'AS_WORN' ? '🔥 Estado de uso' : '✨ Higienizado'}
            {' · '}
            Envio em {product.physicalQuestion.deliveryDays} dias
          </p>
        )}
      </div>
    </div>
  );
}