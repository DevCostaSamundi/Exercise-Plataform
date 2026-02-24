import { useState, useEffect } from 'react';
import trendingService from '../../services/trendingService'; // USAR SERVIÇO
import postService from '../../services/postService';
import { TRENDING_PERIODS } from '../../config/constants';
import PostCard from '../../components/subscriber/PostCard';
import CreatorCard from '../../components/subscriber/CreatorCard';
import { FiTrendingUp, FiHash } from 'react-icons/fi';

const Trending = () => {
  const [period, setPeriod] = useState(TRENDING_PERIODS.DAY);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [trendingCreators, setTrendingCreators] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    fetchTrending();
  }, [period, activeTab]);

  const fetchTrending = async () => {
    try {
      setLoading(true);

      if (activeTab === 'posts') {
        const response = await trendingService.getTrendingPosts({ period });
        setTrendingPosts(response.posts || []);
      } else if (activeTab === 'creators') {
        const response = await trendingService.getTrendingCreators({ period });
        setTrendingCreators(response.creators || []);
      } else if (activeTab === 'tags') {
        const response = await trendingService.getTrendingTags({ period });
        setTrendingTags(response.tags || []);
      }
    } catch (err) {
      console.error('Erro ao buscar trending:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await postService.likePost(postId);
      } else {
        await postService.unlikePost(postId);
      }
    } catch (err) {
      console.error('Erro ao curtir:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-3xl text-black" />
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
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${period === option.value
                  ? 'bg-black text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2">
          {[
            { value: 'posts', label: 'Posts' },
            { value: 'creators', label: 'Criadores' },
            { value: 'tags', label: 'Tags' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === tab.value
                  ? 'bg-black text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black dark:border-white border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="grid grid-cols-1 md: grid-cols-2 lg: grid-cols-3 gap-6">
              {trendingPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                />
              ))}
              {trendingPosts.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  Nenhum post em trending no momento
                </div>
              )}
            </div>
          )}

          {/* Creators Tab */}
          {activeTab === 'creators' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
              {trendingCreators.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  Nenhum criador em trending no momento
                </div>
              )}
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="text-center py-12 text-gray-400">
              Sistema de tags em desenvolvimento
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Trending;