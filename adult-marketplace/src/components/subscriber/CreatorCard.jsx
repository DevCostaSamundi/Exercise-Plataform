import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { formatCurrency, formatNumber, truncateText } from '../../utils/formatters';

const CreatorCard = ({ creator, onSubscribe, isSubscribed: initialSubscribed = false }) => {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [loading,      setLoading]      = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      await onSubscribe?.(creator._id, !isSubscribed);
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error('Erro ao assinar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      to={`/creator/${creator.username}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden group"
    >
      {/* Cover */}
      <div className="relative h-32 bg-slate-200 dark:bg-slate-700">
        {creator.coverImage ? (
          <img src={creator.coverImage} alt={`${creator.name} cover`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-300 dark:bg-slate-600" />
        )}
        {creator.isVerified && (
          <div className="absolute top-3 right-3 bg-black text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <FiCheck className="text-sm" /> Verificado
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="relative px-4">
        <img
          src={creator.avatar || '/default-avatar.png'}
          alt={creator.name}
          className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 object-cover -mt-10 relative z-10"
        />
      </div>

      {/* Info */}
      <div className="px-4 pb-4">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{creator.name}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">@{creator.username}</p>
        </div>

        {creator.bio && (
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
            {truncateText(creator.bio, 80)}
          </p>
        )}

        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <FiHeart className="text-slate-900" />
            <span>{formatNumber(creator.likesCount || 0)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <FiMessageCircle className="text-black" />
            <span>{formatNumber(creator.postsCount || 0)} posts</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {formatNumber(creator.subscribersCount || 0)} assinantes
          </div>
        </div>

        {/* ⚠️  CORRIGIDO: era 'py-2. 5' com espaço — classe Tailwind inválida */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`w-full py-2.5 rounded-lg font-semibold transition-all ${
            isSubscribed
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              : 'bg-black dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Processando...' : isSubscribed ? 'Assinando' : (
            <>Assinar · {formatCurrency(creator.subscriptionPrice || 0)}/mês</>
          )}
        </button>
      </div>

      {/* Preview Posts */}
      {creator.previewPosts && creator.previewPosts.length > 0 && (
        <div className="border-t dark:border-gray-700 grid grid-cols-3 gap-px bg-gray-200 dark:bg-gray-700">
          {creator.previewPosts.slice(0, 3).map((post, index) => (
            <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
              {post.media?.[0] ? (
                <img
                  src={post.media[0].thumbnail || post.media[0].url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
          ))}
        </div>
      )}
    </Link>
  );
};

export default CreatorCard;