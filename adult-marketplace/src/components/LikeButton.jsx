/**
 * LikeButton Component
 * Botão de like funcional com animação e integração com backend
 */

import { useState, useEffect } from 'react';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';

const LikeButton = ({ postId, initialLiked = false, initialCount = 0, onLikeChange }) => {
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialCount);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLiked(initialLiked);
        setLikeCount(initialCount);
    }, [initialLiked, initialCount]);

    const handleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;

        // Optimistic UI update
        const newLikedState = !isLiked;
        const newCount = newLikedState ? likeCount + 1 : likeCount - 1;

        setIsLiked(newLikedState);
        setLikeCount(newCount);
        setIsAnimating(true);

        setTimeout(() => setIsAnimating(false), 600);

        setIsLoading(true);

        try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/v1/posts/${postId}/like`, {
                method: newLikedState ? 'POST' : 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to update like');
            }

            const data = await response.json();

            // Update with actual count from server
            if (data.likeCount !== undefined) {
                setLikeCount(data.likeCount);
            }

            // Notify parent component
            if (onLikeChange) {
                onLikeChange(newLikedState, data.likeCount || newCount);
            }
        } catch (error) {
            console.error('Error updating like:', error);

            // Revert optimistic update on error
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
                    <FaHeart
                        className={`h-6 w-6 text-slate-900 ${isAnimating ? 'animate-like-bounce' : ''
                            }`}
                    />
                ) : (
                    <FiHeart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                )}

                {/* Ripple effect on like */}
                {isAnimating && isLiked && (
                    <div className="absolute inset-0 rounded-full bg-slate-900 opacity-50 animate-ping" />
                )}
            </div>

            <span className={`text-sm font-medium ${isLiked ? 'text-slate-900' : ''}`}>
                {likeCount > 0 ? likeCount.toLocaleString() : ''}
            </span>

            {/* Add custom animation to tailwind.config.js:
        animation: {
          'like-bounce': 'like-bounce 0.6s ease-in-out',
        },
        keyframes: {
          'like-bounce': {
            '0%, 100%': { transform: 'scale(1)' },
            '25%': { transform: 'scale(1.3)' },
            '50%': { transform: 'scale(0.9)' },
            '75%': { transform: 'scale(1.1)' },
          },
        },
      */}
        </button>
    );
};

export default LikeButton;
