/**
 * Card de Post para o Feed
 * Exibe preview de post com suporte para PPV
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiShare2, FiLock, FiMoreVertical } from 'react-icons/fi';
import { formatRelativeTime, formatNumber, truncateText } from '../../utils/formatters';
import PPVModal from './PPVModal';
import feedService from '../../services/feedService';

const PostCard = ({ post, onLike, onUnlock }) => {
  const [showPPVModal, setShowPPVModal] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);

  const isPPV = post.isPPV && !post.isUnlocked;
  const hasMultipleMedia = post.media && post.media.length > 1;

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      await feedService.likePost(post.id || post._id);
    } catch (error) {
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
      console.error('Error liking post:', error);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      navigator.share({
        title: `Post de ${post.creator.name}`,
        text: post.caption || '',
        url: `${window.location.origin}/post/${post.id || post._id}`,
      });
    } else {
      // Fallback: copiar link
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id || post._id}`);
      alert('Link copiado!');
    }
  };

  const handleUnlockPPV = async (paymentData) => {
    if (onUnlock) {
      await onUnlock(post.id || post._id, paymentData);
    }
    setShowPPVModal(false);
  };

  return (
    <>
      <Link
        to={`/post/${post.id || post._id}`}
        className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
      >
        {/* Header do Card */}
        <div className="flex items-center justify-between p-4">
          <Link
            to={`/creator/${post.creator.username}`}
            className="flex items-center gap-3 hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={post.creator.avatar || '/default-avatar.png'}
              alt={post.creator.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {post.creator.name}
                {post.creator.isVerified && (
                  <span className="ml-1 text-blue-500">✓</span>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{post.creator.username} · {formatRelativeTime(post.createdAt)}
              </p>
            </div>
          </Link>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <FiMoreVertical className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 pb-3">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {truncateText(post.caption, 200)}
            </p>
          </div>
        )}

        {/* Media Preview */}
        {post.media && post.media.length > 0 && (
          <div className="relative bg-gray-100 dark:bg-gray-900">
            {isPPV ?  (
              // PPV Locked Preview
              <div className="relative aspect-square">
                <img
                  src={post.media[0].thumbnail || post.media[0].url}
                  alt="Preview"
                  className="w-full h-full object-cover blur-2xl"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                  <FiLock className="text-white text-6xl mb-4" />
                  <p className="text-white text-xl font-bold mb-2">
                    Conteúdo Exclusivo
                  </p>
                  <p className="text-white text-lg mb-4">
                    {formatCurrency(post.price, post.currency)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPPVModal(true);
                    }}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-colors"
                  >
                    Desbloquear
                  </button>
                </div>
              </div>
            ) : (
              // Normal Preview
              <div className="relative aspect-square">
                {post.media[0].type === 'video' ? (
                  <video
                    src={post.media[0].url}
                    className="w-full h-full object-cover"
                    controls={false}
                  />
                ) : (
                  <img
                    src={post.media[0].url}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                )}

                {hasMultipleMedia && (
                  <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                    +{post.media.length - 1}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
          <div className="flex items-center gap-6">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition-colors ${
                isLiked
                  ? 'text-red-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              <FiHeart className={`text-xl ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{formatNumber(likeCount)}</span>
            </button>

            {/* Comments */}
            <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
              <FiMessageCircle className="text-xl" />
              <span className="text-sm font-medium">
                {formatNumber(post.commentsCount || 0)}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors"
            >
              <FiShare2 className="text-xl" />
            </button>
          </div>

          {isPPV && (
            <span className="flex items-center gap-1 text-purple-600 font-semibold">
              <FiLock className="text-sm" />
              PPV
            </span>
          )}
        </div>
      </Link>

      {/* PPV Modal */}
      {showPPVModal && (
        <PPVModal
          content={{
            type: 'post',
            id: post.id || post._id,
            creator: post.creator,
            price: post.price,
            preview: post.media?.[0],
            description: post.caption,
          }}
          onClose={() => setShowPPVModal(false)}
          onUnlock={handleUnlockPPV}
        />
      )}
    </>
  );
};

export default PostCard;