/**
 * Perfil Público do Criador
 * Visualização do perfil de um criador
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import creatorService from '../../services/creatorService';
import subscriptionService from '../../services/subscriptionService';
import favoriteService from '../../services/favoriteService';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import {
  FiHeart,
  FiMessageCircle,
  FiMapPin,
  FiLink,
  FiInstagram,
  FiTwitter,
  FiCheck,
  FiGrid,
  FiInfo,
  FiShoppingBag,
} from 'react-icons/fi';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import PostCard from '../../components/subscriber/PostCard';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';

const CreatorProfile = () => {
  const { username } = useParams();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('posts');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const lastPostRef = useInfiniteScroll(loadMorePosts, hasMore, postsLoading);

  useEffect(() => {
    fetchCreator();
  }, [username]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts(1, false);
    }
  }, [activeTab]);

  const fetchCreator = async () => {
    try {
      setLoading(true);
      // ✅ USAR SERVIÇO
      const response = await creatorService.getCreatorProfileByUsername(username);
      setCreator(response.data);
    } catch (err) {
      console.error('Erro ao buscar criador:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (pageNum, append = true) => {
    try {
      setPostsLoading(true);
      // ✅ USAR SERVIÇO
      const response = await creatorService.getCreatorPostsByUsername(username, {
        page: pageNum,
        limit: 20,
      });

      const newPosts = response.data || [];
      const pagination = response.pagination || {};

      setIsSubscribed(response.isSubscribed || false);

      if (append) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(pagination.page < pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Erro ao buscar posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setSubscribing(true);

      if (isSubscribed) {
        // Cancelar assinatura
        const subs = await subscriptionService.getSubscriptions();
        const subscription = subs.data?.find(s => s.creatorId === creator.id && s.status === 'ACTIVE');

        if (subscription) {
          await subscriptionService.cancelSubscription(subscription.id);
          setIsSubscribed(false);
        }
      } else {
        // ✅ CRIAR ASSINATURA CORRETAMENTE
        await subscriptionService.createSubscription(creator.id);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Erro ao gerenciar assinatura:', err);
      alert(err.response?.data?.message || 'Erro ao processar assinatura');
    } finally {
      setSubscribing(false);
    }
  };

  const handleFavorite = async () => {
    try {
      // ✅ USAR SERVIÇO DE FAVORITOS
      await favoriteService.toggleFavorite(creator.id);
      setIsFavorited(!isFavorited);
    } catch (err) {
      console.error('Erro ao favoritar:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Criador não encontrado</p>
      </div>
    );
  }

  const canViewContent = isSubscribed || creator.hasFreeContent;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-slate-200 dark:bg-slate-700 rounded-t-lg overflow-hidden">
        {creator.coverImage ? (
          <img
            src={creator.coverImage}
            alt={`${creator.displayName} cover`}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>

      {/* Profile Info */}
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <img
              src={creator.avatar || '/default-avatar.png'}
              alt={creator.displayName}
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg"
            />
          </div>

          {/* Info & Actions */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {creator.displayName}
                  {creator.isVerified && (
                    <span className="text-black text-xl">
                      <FiCheck className="inline" />
                    </span>
                  )}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  @{creator.username}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleFavorite}
                  className={`p-3 rounded-lg border-2 transition-all ${isFavorited
                    ? 'border-red-500 bg-slate-900 dark:bg-slate-900/20 text-slate-900'
                    : 'border-gray-300 dark:border-gray-600 hover:border-red-500 text-gray-600 dark:text-gray-400'
                    }`}
                  title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <FiHeart className={isFavorited ? 'fill-current' : ''} />
                </button>

                <Link
                  to={`/messages/${creator.userId}`}
                  className="p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 text-gray-600 dark:text-gray-400 hover:text-black transition-all"
                  title="Enviar mensagem"
                >
                  <FiMessageCircle />
                </Link>

                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className={`px-6 py-3 rounded-lg font-bold transition-all ${isSubscribed
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                    : 'bg-black dark:bg-white text-white dark:text-black hover:scale-105 transition-all'
                    } ${subscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {subscribing
                    ? 'Processando...'
                    : isSubscribed
                      ? 'Assinando'
                      : `Assinar · ${formatCurrency(creator.subscriptionPrice)}/mês`}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mb-4">
              <div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatNumber(creator.posts || 0)}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  posts
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatNumber(creator.subscribers || 0)}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  assinantes
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatNumber(creator.photos || 0)}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  fotos
                </span>
              </div>
            </div>

            {/* Bio */}
            {creator.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                {creator.bio}
              </p>
            )}

            {/* Location & Links */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              {creator.location && (
                <div className="flex items-center gap-1">
                  <FiMapPin />
                  {creator.location}
                </div>
              )}
              {creator.website && (
                <a
                  href={creator.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-black"
                >
                  <FiLink />
                  {creator.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {creator.instagram && (
                <a
                  href={`https://instagram.com/${creator.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-black"
                >
                  <FiInstagram />
                  @{creator.instagram}
                </a>
              )}
              {creator.twitter && (
                <a
                  href={`https://twitter.com/${creator.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-black"
                >
                  <FiTwitter />
                  @{creator.twitter}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mt-6 -mb-6">
          {[
            { id: 'posts', label: 'Posts', icon: FiGrid },
            { id: 'about', label: 'Sobre', icon: FiInfo },
            { id: 'shop', label: 'Loja', icon: FiShoppingBag },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all ${activeTab === tab.id
                  ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <Icon />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'posts' && (
          <div>
            {!canViewContent ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-black dark:bg-black/20 rounded-full flex items-center justify-center">
                  <FiGrid className="text-4xl text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Conteúdo Exclusivo
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Assine para ter acesso a todos os posts de {creator.displayName}
                </p>
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold hover:scale-105 transition-all"
                >
                  Assinar por {formatCurrency(creator.subscriptionPrice)}/mês
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post, index) => {
                  const isLast = index === posts.length - 1;
                  return (
                    <div key={post.id} ref={isLast ? lastPostRef : null}>
                      <PostCard post={post} />
                    </div>
                  );
                })}

                {postsLoading && (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Você viu todos os posts!
                  </div>
                )}

                {posts.length === 0 && !postsLoading && (
                  <div className="text-center py-12 text-gray-500">
                    Nenhum post ainda
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Sobre {creator.displayName}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {creator.bio || creator.description || 'Sem informações adicionais.'}
            </p>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <FiShoppingBag className="text-6xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loja em breve! </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorProfile;