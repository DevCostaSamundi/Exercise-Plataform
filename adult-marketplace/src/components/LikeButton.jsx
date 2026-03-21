import { useState, useEffect } from 'react';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const LikeButton = ({ postId, initialLiked = false, initialCount = 0, onLikeChange }) => {
  const [isLiked,     setIsLiked]     = useState(initialLiked);
  const [likeCount,   setLikeCount]   = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);

  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    // Optimistic update
    const newLikedState = !isLiked;
    const newCount      = newLikedState ? likeCount + 1 : likeCount - 1;

    setIsLiked(newLikedState);
    setLikeCount(newCount);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    setIsLoading(true);

    try {
      // ⚠️  CORRIGIDO: o backend usa sempre POST /posts/:postId/like (toggle)
      // DELETE não existe nessa rota
      const response = await fetch(`/api/v1/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to update like');

      const data = await response.json();

      // Usar contagem real do servidor
      if (data.data?.likesCount !== undefined) {
        setLikeCount(data.data.likesCount);
        setIsLiked(data.data.liked);
      }

      onLikeChange?.(data.data?.liked ?? newLikedState, data.data?.likesCount ?? newCount);
    } catch (error) {
      // Reverter optimistic update
      setIsLiked(!newLikedState);
      setLikeCount(newLikedState ? newCount - 1 : newCount + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      <div className="relative">
        {isLiked ? (
          <FaHeart className={`h-6 w-6 text-slate-900 ${isAnimating ? 'animate-bounce' : ''}`} />
        ) : (
          <FiHeart className="h-6 w-6 group-hover:scale-110 transition-transform" />
        )}
        {isAnimating && isLiked && (
          <div className="absolute inset-0 rounded-full bg-slate-900 opacity-30 animate-ping" />
        )}
      </div>

      <span className={`text-sm font-medium ${isLiked ? 'text-slate-900' : ''}`}>
        {likeCount > 0 ? likeCount.toLocaleString() : ''}
      </span>
    </button>
  );
};

export default LikeButton;