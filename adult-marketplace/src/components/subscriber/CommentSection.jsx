/**
 * Seção de Comentários
 * Com replies, curtidas e ordenação
 */

import { useState, useEffect } from 'react';
import { FiHeart, FiMessageCircle, FiSend } from 'react-icons/fi';
import { formatRelativeTime } from '../../utils/formatters';
import feedService from '../../services/feedService';

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'popular'

  useEffect(() => {
    fetchComments();
  }, [postId, sortBy]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await feedService.getComments(postId, { sort: sortBy });
      setComments(response.comments);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await feedService.commentPost(postId, {
        text: newComment,
        parentId: replyTo?._id,
      });

      // Add new comment to list
      if (replyTo) {
        // Add as reply
        setComments(prev =>
          prev.map(comment =>
            comment._id === replyTo._id
              ? { ...comment, replies: [...(comment.replies || []), response.comment] }
              : comment
          )
        );
      } else {
        // Add as top-level comment
        setComments(prev => [response.comment, ...prev]);
      }

      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Erro ao postar comentário:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await feedService.likeComment(commentId);

      // Update local state
      setComments(prev =>
        prev.map(comment =>
          comment._id === commentId
            ? { ...comment, likes: comment.likes + 1, isLiked: true }
            : comment
        )
      );
    } catch (error) {
      console.error('Erro ao curtir comentário:', error);
    }
  };

  const Comment = ({ comment, isReply = false }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      <img
        src={comment.author.avatar || '/default-avatar.png'}
        alt={comment.author.name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />

      <div className="flex-1">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {comment.author.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
            {comment.text}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs">
          <button
            onClick={() => handleLikeComment(comment._id)}
            className={`flex items-center gap-1 ${
              comment.isLiked
                ? 'text-red-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
            }`}
          >
            <FiHeart className={comment.isLiked ? 'fill-current' : ''} />
            <span>{comment.likes || 0}</span>
          </button>

          {!isReply && (
            <button
              onClick={() => setReplyTo(comment)}
              className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-500"
            >
              <FiMessageCircle />
              Responder
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => (
              <Comment key={reply._id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Comentários ({comments.length})
        </h3>

        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1 rounded-full text-sm ${
              sortBy === 'recent'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Recentes
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1 rounded-full text-sm ${
              sortBy === 'popular'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Populares
          </button>
        </div>
      </div>

      {/* New Comment Input */}
      <form onSubmit={handlePostComment} className="flex gap-3">
        <div className="flex-1">
          {replyTo && (
            <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
              Respondendo a <span className="font-semibold">{replyTo.author.name}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 text-red-500 hover:underline"
              >
                Cancelar
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? "Escreva sua resposta..." : "Escreva um comentário..."}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiSend />
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando comentários...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Seja o primeiro a comentar! 
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <Comment key={comment._id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;