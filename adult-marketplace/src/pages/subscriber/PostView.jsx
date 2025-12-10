/**
 * Visualização Completa de Post
 * Post detalhado com comentários
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiHeart, FiShare2, FiLock, FiArrowLeft } from 'react-icons/fi';
import { formatRelativeTime, formatNumber } from '../../utils/formatters';
import MediaViewer from '../../components/subscriber/MediaViewer';
import CommentSection from '../../components/subscriber/CommentSection';
import PPVModal from '../../components/subscriber/PPVModal';
import feedService from '../../services/feedService';
import api from '../../services/api';

const PostView = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [showPPVModal, setShowPPVModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await feedService.getPost(postId);

      setPost(response.post);
      setIsLiked(response.post.isLiked);
      setLikeCount(response.post.likes);
    } catch (err) {
      console.error('Erro ao buscar post:', err);
      if (err.response?.status === 404) {
        navigate('/feed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

      await feedService.likePost(postId);
    } catch (err) {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
      console.error('Erro ao curtir:', err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post de ${post.creator.name}`,
        text: post.caption || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  const handleUnlockPPV = async (paymentData) => {
    try {
      await api.post(`/payments/ppv/post/${postId}`, paymentData);

      // Refresh post
      await fetchPost();
      setShowPPVModal(false);
    } catch (err) {
      console.error('Erro ao desbloquear:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Post não encontrado</p>
      </div>
    );
  }

  const isPPV = post.isPPV && !post.isUnlocked;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <FiArrowLeft />
        Voltar
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Creator Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <Link
            to={`/creator/${post.creator.username}`}
            className="flex items-center gap-3 hover:opacity-80"
          >
            <img
              src={post.creator.avatar || '/default-avatar.png'}
              alt={post.creator.name}
              className="w-12 h-12 rounded-full object-cover"
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
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <FiShare2 className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="p-6 border-b dark:border-gray-700">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-lg">
              {post.caption}
            </p>
          </div>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="relative bg-gray-100 dark:bg-gray-900">
            {isPPV ? (
              // PPV Locked
              <div className="relative aspect-video">
                <img
                  src={post.media[0].thumbnail || post.media[0].url}
                  alt="Preview"
                  className="w-full h-full object-cover blur-3xl"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60">
                  <FiLock className="text-white text-7xl mb-6" />
                  <p className="text-white text-2xl font-bold mb-3">
                    Conteúdo Exclusivo
                  </p>
                  <p className="text-white text-xl mb-6">
                    R$ {post.price?.toFixed(2)}
                  </p>
                  <button
                    onClick={() => setShowPPVModal(true)}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-lg transition-colors"
                  >
                    Desbloquear Agora
                  </button>
                </div>
              </div>
            ) : (
              // Unlocked Media
              <div
                onClick={() => setShowMediaViewer(true)}
                className="cursor-pointer"
              >
                {post.media[0].type === 'video' ? (
                  <video
                    src={post.media[0].url}
                    controls
                    className="w-full"
                  />
                ) : (
                  <img
                    src={post.media[0].url}
                    alt="Post"
                    className="w-full object-contain max-h-[600px]"
                  />
                )}

                {post.media.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    +{post.media.length - 1} fotos
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 p-6 border-b dark:border-gray-700">
          <button
            onClick={handleLike}
            disabled={isPPV}
            className={`flex items-center gap-2 transition-colors ${
              isLiked
                ? 'text-red-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
            } ${isPPV ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FiHeart
              className={`text-2xl ${isLiked ? 'fill-current' : ''}`}
            />
            <span className="font-semibold">{formatNumber(likeCount)}</span>
          </button>

          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span className="font-semibold">
              {formatNumber(post.commentsCount || 0)} comentários
            </span>
          </div>
        </div>

        {/* Comments */}
        {!isPPV && (
          <div className="p-6">
            <CommentSection postId={postId} />
          </div>
        )}
      </div>

      {/* Media Viewer */}
      {showMediaViewer && !isPPV && (
        <MediaViewer
          media={post.media}
          initialIndex={0}
          onClose={() => setShowMediaViewer(false)}
          allowDownload={false}
        />
      )}

      {/* PPV Modal */}
      {showPPVModal && (
        <PPVModal
          content={{
            type: 'post',
            id: post._id,
            creator: post.creator,
            price: post.price,
            preview: post.media[0],
            description: post.caption,
          }}
          onClose={() => setShowPPVModal(false)}
          onUnlock={handleUnlockPPV}
        />
      )}
    </div>
  );
};

export default PostView;