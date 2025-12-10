/**
 * Seção de Comentários
 * Comentários em posts
 */

import { useState, useEffect } from 'react';
import { FiSend, FiTrash2 } from 'react-icons/fi';
import { formatRelativeTime } from '../../utils/formatters';
import feedService from '../../services/feedService';

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await feedService.getComments(postId);
      setComments(response.data || []);
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
      setSubmitting(true);
      const response = await feedService.commentPost(postId, {
        content: newComment,
      });

      // Add new comment to list
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Erro ao postar comentário:', error);
      alert('Erro ao postar comentário. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Tem certeza que deseja deletar este comentário?')) {
      return;
    }

    try {
      await feedService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      alert('Erro ao deletar comentário.');
    }
  };

  const Comment = ({ comment }) => {
    // Get current user from localStorage to check ownership
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwner = currentUser.id === comment.author._id;

    return (
      <div className="flex gap-3">
        <img
          src={comment.author.avatar || '/default-avatar.png'}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />

        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {comment.author.name}
                  {comment.author.isVerified && (
                    <span className="ml-1 text-blue-500">✓</span>
                  )}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  className="text-red-500 hover:text-red-600 p-1"
                  title="Deletar comentário"
                >
                  <FiTrash2 className="text-sm" />
                </button>
              )}
            </div>
            <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="font-semibold text-gray-900 dark:text-white">
        Comentários ({comments.length})
      </h3>

      {/* New Comment Input */}
      <form onSubmit={handlePostComment} className="flex gap-3">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FiSend />
          </button>
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