/**
 * CommentSection Component
 * Sistema completo de comentários com respostas
 */

import { useState, useEffect } from 'react';
import { FiSend, FiTrash2, FiMessageCircle } from 'react-icons/fi';

const CommentSection = ({ postId, creatorId, currentUserId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/v1/posts/${postId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }

            const data = await response.json();
            setComments(data.comments || []);
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError('Erro ao carregar comentários');
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();

        if (!newComment.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/v1/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    content: newComment.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to post comment');
            }

            const data = await response.json();

            // Add new comment to list
            setComments([data.comment, ...comments]);
            setNewComment('');
        } catch (err) {
            console.error('Error posting comment:', err);
            setError('Erro ao enviar comentário');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReply = async (e, commentId) => {
        e.preventDefault();

        if (!replyText.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/v1/comments/${commentId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    content: replyText.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to post reply');
            }

            const data = await response.json();

            // Update comments with new reply
            setComments(comments.map(comment =>
                comment._id === commentId
                    ? { ...comment, replies: [...(comment.replies || []), data.reply] }
                    : comment
            ));

            setReplyText('');
            setReplyingTo(null);
        } catch (err) {
            console.error('Error posting reply:', err);
            setError('Erro ao enviar resposta');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Tem certeza que deseja excluir este comentário?')) {
            return;
        }

        try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/v1/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }

            // Remove comment from list
            setComments(comments.filter(comment => comment._id !== commentId));
        } catch (err) {
            console.error('Error deleting comment:', err);
            setError('Erro ao excluir comentário');
        }
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 60) return 'agora';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return new Date(date).toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-4">
            {/* Comment Input */}
            <form onSubmit={handleSubmitComment} className="flex gap-3">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicione um comentário..."
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-slate-900 dark:text-white placeholder-slate-400"
                    disabled={submitting}
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="px-4 py-2 bg-black hover:bg-black text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <FiSend className="text-lg" />
                    {submitting ? 'Enviando...' : 'Enviar'}
                </button>
            </form>

            {/* Error Message */}
            {error && (
                <div className="bg-slate-900 dark:bg-slate-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-slate-900 dark:text-slate-900">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Comments List */}
            {!loading && comments.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <FiMessageCircle className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>Seja o primeiro a comentar!</p>
                </div>
            )}

            {!loading && comments.length > 0 && (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div key={comment._id} className="space-y-3">
                            {/* Comment */}
                            <div className="flex gap-3">
                                <img
                                    src={comment.user?.avatar || '/default-avatar.png'}
                                    alt={comment.user?.name}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                                    {comment.user?.name}
                                                </span>
                                                {comment.user?._id === creatorId && (
                                                    <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">
                                                        Criador
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {formatTimeAgo(comment.createdAt)}
                                                </span>

                                                {comment.user?._id === currentUserId && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        className="text-slate-900 hover:text-slate-900 transition-colors"
                                                        aria-label="Delete comment"
                                                    >
                                                        <FiTrash2 className="text-sm" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-slate-700 dark:text-slate-300 text-sm">
                                            {comment.content}
                                        </p>
                                    </div>

                                    {/* Reply Button */}
                                    <button
                                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                        className="text-xs text-black dark:text-black hover:underline mt-1 ml-3"
                                    >
                                        Responder
                                    </button>

                                    {/* Reply Input */}
                                    {replyingTo === comment._id && (
                                        <form
                                            onSubmit={(e) => handleSubmitReply(e, comment._id)}
                                            className="flex gap-2 mt-2 ml-3"
                                        >
                                            <input
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Escreva uma resposta..."
                                                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm text-slate-900 dark:text-white"
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={!replyText.trim() || submitting}
                                                className="px-3 py-1.5 bg-black hover:bg-black text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                <FiSend />
                                            </button>
                                        </form>
                                    )}

                                    {/* Replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="mt-3 ml-3 space-y-3 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                                            {comment.replies.map((reply) => (
                                                <div key={reply._id} className="flex gap-2">
                                                    <img
                                                        src={reply.user?.avatar || '/default-avatar.png'}
                                                        alt={reply.user?.name}
                                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                    />

                                                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg p-2">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-semibold text-slate-900 dark:text-white text-xs">
                                                                {reply.user?.name}
                                                            </span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                {formatTimeAgo(reply.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-700 dark:text-slate-300 text-xs">
                                                            {reply.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentSection;
