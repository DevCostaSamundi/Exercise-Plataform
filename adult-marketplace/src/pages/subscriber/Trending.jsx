/**
 * Página Trending
 * Conteúdo em alta
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, TRENDING_PERIODS } from '../../utils/constants';
import PostCard from '../../components/subscriber/PostCard';
import CreatorCard from '../../components/subscriber/CreatorCard';
import { FiTrendingUp, FiHash } from 'react-icons/fi';

const Trending = () => {
  const [period, setPeriod] = useState(TRENDING_PERIODS.DAY);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [trendingCreators, setTrendingCreators] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'creators', 'tags'

  useEffect(() => {
    fetchTrending();
  }, [period, activeTab]);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pride_connect_token');

      if (activeTab === 'posts') {
        const response = await axios.get(`${API_BASE_URL}/posts/trending`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { period },
        });
        setTrendingPosts(response.data.posts);
      } else if (activeTab === 'creators') {
        const response = await axios.get(`${API_BASE_URL}/creators/trending`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { period },
        });
        setTrendingCreators(response.data.creators);
      } else if (activeTab === 'tags') {
        const response = await axios.get(`${API_BASE_URL}/tags/trending`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { period },
        });
        setTrendingTags(response.data.tags);
      }
    } catch (err) {
      console.error('Erro ao buscar trending:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      const token = localStorage.getItem('pride_connect_token');
      await axios.post(
        `${API_BASE_URL}/posts/${postId}/like`,
        { liked: isLiked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Erro ao curtir:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-3xl text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Em Alta
          </h1>
        </div>

        {/* Period Selection */}
        <div className="flex gap-2 mb-4">
          {[
            { value: TRENDING_PERIODS.DAY, label: 'Hoje' },
            { value: TRENDING_PERIODS.WEEK, label: 'Esta Semana' },
            { value: TRENDING_PERIODS.MONTH, label: 'Este Mês' },
          ]. map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                period === option.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {[
            { value: 'posts', label: 'Posts' },
            { value: 'creators', label: 'Criadores' },
            { value: 'tags', label: 'Tags' },
          ]. map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 font-semibold transition-all ${
                activeTab === tab.value
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {trendingPosts.map((post) => (
                <PostCard key={post._id} post={post} onLike={handleLike} />
              ))}
              {trendingPosts.length === 0 && (
                <p className="text-center text-gray-500 py-12">
                  Nenhum post em alta neste período
                </p>
              )}
            </div>
          )}

          {/* Creators Tab */}
          {activeTab === 'creators' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingCreators.map((creator) => (
                <CreatorCard key={creator._id} creator={creator} />
              ))}
              {trendingCreators.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-12">
                  Nenhum criador em alta neste período
                </p>
              )}
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {trendingTags.map((tag) => (
                <div
                  key={tag.name}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FiHash className="text-purple-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {tag.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tag.count} posts
                  </p>
                </div>
              ))}
              {trendingTags.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-12">
                  Nenhuma tag em alta neste período
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Trending;