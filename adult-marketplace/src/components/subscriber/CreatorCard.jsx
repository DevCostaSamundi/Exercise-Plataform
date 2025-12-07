/**
 * Card de Criador para Exploração
 * Exibe preview do criador com botão de assinar
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { formatCurrency, formatNumber, truncateText } from '../../utils/formatters';

const CreatorCard = ({ creator, onSubscribe, isSubscribed: initialSubscribed = false }) => {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      if (onSubscribe) {
        await onSubscribe(creator._id, !isSubscribed);
      }
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
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-500">
        {creator.coverImage ? (
          <img
            src={creator.coverImage}
            alt={`${creator.name} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500" />
        )}
        
        {/* Verified Badge */}
        {creator.isVerified && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <FiCheck className="text-sm" />
            Verificado
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
          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
            {creator.name}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            @{creator.username}
          </p>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
            {truncateText(creator.bio, 80)}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <FiHeart className="text-red-500" />
            <span>{formatNumber(creator.likesCount || 0)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <FiMessageCircle className="text-blue-500" />
            <span>{formatNumber(creator.postsCount || 0)} posts</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {formatNumber(creator.subscribersCount || 0)} assinantes
          </div>
        </div>

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`w-full py-2. 5 rounded-lg font-semibold transition-all ${
            isSubscribed
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            'Processando...'
          ) : isSubscribed ? (
            'Assinando'
          ) : (
            <>Assinar · {formatCurrency(creator.subscriptionPrice || 0)}/mês</>
          )}
        </button>
      </div>

      {/* Preview Posts (hover effect) */}
      {creator.previewPosts && creator.previewPosts.length > 0 && (
        <div className="border-t dark:border-gray-700 grid grid-cols-3 gap-px bg-gray-200 dark:bg-gray-700">
          {creator.previewPosts.slice(0, 3).map((post, index) => (
            <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
              {post.media && post.media[0] ?  (
                <img
                  src={post.media[0].thumbnail || post.media[0].url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500" />
              )}
            </div>
          ))}
        </div>
      )}
    </Link>
  );
};

export default CreatorCard;