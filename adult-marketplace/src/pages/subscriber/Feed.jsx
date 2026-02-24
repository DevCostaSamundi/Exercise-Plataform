

import { useState, useEffect } from 'react';
import { CONTENT_TYPES } from '../../utils/constansts';
import PostCard from '../../components/subscriber/PostCard';
import FilterBar from '../../components/subscriber/FilterBar';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { FiRefreshCw } from 'react-icons/fi';
import feedService from '../../services/feedService';
import api from '../../services/api';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(CONTENT_TYPES.ALL);
  const [error, setError] = useState('');

  const lastPostRef = useInfiniteScroll(loadMorePosts, hasMore, loading);

  useEffect(() => {
    fetchPosts(1, false);
  }, [filter]);

  const fetchPosts = async (pageNum, append = true) => {
    try {
      setLoading(true);
      setError('');

      const response = await feedService.getFeed({
        page: pageNum,
        limit: 20,
        type: filter !== CONTENT_TYPES.ALL ? filter : undefined,
      });

      const { posts: newPosts, hasMore: more } = response;

      if (append) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(more);
      setPage(pageNum);
    } catch (err) {
      console.error('Erro ao buscar feed:', err);
      setError(err.response?.data?.message || 'Erro ao carregar feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  function loadMorePosts() {
    if (!loading && hasMore) {
      fetchPosts(page + 1, true);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(1, false);
  };

  const handleLike = async (postId, isLiked) => {
    try {
      await feedService.likePost(postId, isLiked);
    } catch (err) {
      console.error('Erro ao curtir post:', err);
    }
  };

  const handleUnlockPPV = async (postId, paymentData) => {
    try {
      await api.post(`/payments/ppv/post/${postId}`, paymentData);

      // Update post to unlocked
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, isUnlocked: true } : post
        )
      );
    } catch (err) {
      console.error('Erro ao desbloquear PPV:', err);
      throw err;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Seu Feed
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiRefreshCw
              className={`text-xl text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''
                }`}
            />
          </button>
        </div>

        {/* Filters */}
        <FilterBar activeFilter={filter} onFilterChange={setFilter} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-slate-900 dark:bg-slate-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-slate-900 dark:text-slate-900">{error}</p>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {posts.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <FiRefreshCw className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Seu feed está vazio
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comece seguindo criadores para ver conteúdo aqui!
            </p>
            <a
              href="/explore"
              className="inline-block px-6 py-3 bg-black hover:bg-black text-white rounded-lg font-semibold transition-colors"
            >
              Explorar Criadores
            </a>
          </div>
        ) : (
          <>
            {posts.map((post, index) => {
              const isLast = index === posts.length - 1;
              return (
                <div key={post._id} ref={isLast ? lastPostRef : null}>
                  <PostCard
                    post={post}
                    onLike={handleLike}
                    onUnlock={handleUnlockPPV}
                  />
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Carregando...
                </p>
              </div>
            )}

            {/* No More Posts */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                Você viu tudo por enquanto! 🎉
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Feed;