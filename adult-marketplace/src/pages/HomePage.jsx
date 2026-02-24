import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import creatorService from '../services/creatorService';
import feedService from '../services/feedService';
import { useUI } from '../contexts/UIContext';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import LikeButton from '../components/LikeButton';
import CommentSection from '../components/CommentSection';
import ImageViewer from '../components/ImageViewer';

const FILTER_CATEGORIES = {
  genderIdentity: {
    label: 'Identidade de Gênero',
    icon: '🏳️‍⚧️',
    options: [
      'Trans mulher',
      'Trans homem',
      'Não-binário',
      'Cis homem',
      'Cis mulher',
      'Queer',
      'Gênero fluido',
    ],
  },
  orientation: {
    label: 'Orientação',
    icon: '🏳️‍🌈',
    options: [
      'Gay',
      'Lésbica',
      'Bissexual',
      'Pansexual',
      'Assexual',
      'Queer',
    ],
  },
  contentType: {
    label: 'Tipo de Conteúdo',
    icon: '📸',
    options: [
      'Fotos artísticas',
      'Vídeos curtos',
      'Lives interativas',
      'Chat personalizado',
      'Voz / áudio sensual',
      'Conteúdo educativo',
    ],
  },
  aesthetic: {
    label: 'Estética / Vibe',
    icon: '✨',
    options: [
      'Sensual',
      'Fetichista',
      'Natural',
      'Drag / Performance',
      'Fitness',
      'Adorável',
      'Dominante',
      'Submisso',
    ],
  },
};

function formatPrice(price, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price || 0);
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
}

function HomePage() {
  // ── State ──
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    genderIdentity: [],
    orientation: [],
    contentType: [],
    aesthetic: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [creators, setCreators] = useState([]);
  const [activeTab, setActiveTab] = useState('creators');
  const [sortBy, setSortBy] = useState('popular');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCreators, setTotalCreators] = useState(0);

  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  const [showComments, setShowComments] = useState({});
  const [currentUserId] = useState(null);

  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState(null);

  const searchTimerRef = useRef(null);
  const { discreetMode, toggleDiscreetMode, projectName, logoChar } = useUI();

  // ── Fetch creators ──
  const fetchCreators = async (pageNum = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (selectedFilters.genderIdentity.length > 0)
        filters.genderIdentity = selectedFilters.genderIdentity;
      if (selectedFilters.orientation.length > 0)
        filters.orientation = selectedFilters.orientation;
      if (search.trim()) filters.search = search.trim();

      const response = await creatorService.listCreators({
        page: pageNum,
        limit: 20,
        featured: false,
        ...filters,
      });

      if (response.success) {
        setCreators((prev) =>
          append ? [...prev, ...response.data] : response.data
        );
        setHasMore(response.data.length === 20);
        setTotalCreators(response.total || response.data.length);
      }
    } catch (err) {
      console.error('Erro ao carregar criadores:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Erro ao carregar criadores'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCreators(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      fetchCreators(1, false);
    }, 500);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Refetch on filter change
  useEffect(() => {
    setPage(1);
    fetchCreators(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters]);

  // ── Fetch feed ──
  const fetchFeedPosts = async () => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const response = await feedService.getFeed({ page: 1, limit: 10 });
      setFeedPosts(response.posts || response.data || []);
    } catch {
      setFeedError('Erro ao carregar feed');
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feed') fetchFeedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Handlers ──
  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchCreators(next, true);
  };

  const handleRetry = () => {
    setPage(1);
    fetchCreators(1, false);
  };

  const toggleFilter = (category, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...prev[category], value],
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      genderIdentity: [],
      orientation: [],
      contentType: [],
      aesthetic: [],
    });
    setSearch('');
  };

  // ── Derived data ──
  const activeFiltersCount = Object.values(selectedFilters).flat().length;
  const liveCreators = creators.filter((c) => c.isLive);

  const filteredCreators = creators
    .filter((creator) => {
      const mg =
        selectedFilters.genderIdentity.length === 0 ||
        selectedFilters.genderIdentity.includes(creator.genderIdentity);
      const mo =
        selectedFilters.orientation.length === 0 ||
        selectedFilters.orientation.includes(creator.orientation);
      const mc =
        selectedFilters.contentType.length === 0 ||
        (creator.contentType &&
          selectedFilters.contentType.some((t) =>
            creator.contentType.includes(t)
          ));
      const ma =
        selectedFilters.aesthetic.length === 0 ||
        (creator.aesthetic &&
          selectedFilters.aesthetic.some((a) =>
            creator.aesthetic.includes(a)
          ));
      return mg && mo && mc && ma;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (
            (a.subscriptionPrice ?? a.price ?? 0) -
            (b.subscriptionPrice ?? b.price ?? 0)
          );
        case 'price-high':
          return (
            (b.subscriptionPrice ?? b.price ?? 0) -
            (a.subscriptionPrice ?? a.price ?? 0)
          );
        case 'new':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'trending':
          return (b.subscribers || 0) - (a.subscribers || 0);
        default:
          return 0;
      }
    });

  // ── Sub-components ──
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden">
            <div className="aspect-square bg-slate-300 dark:bg-slate-700" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3 mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const ErrorDisplay = () => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
        Erro ao carregar
      </h3>
      <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
      <button
        onClick={handleRetry}
        className="bg-black text-white px-6 py-2 rounded-lg font-medium"
      >
        Tentar novamente
      </button>
    </div>
  );

  // ── Render ──
  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ─── Header ─── */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
            {/* Top bar */}
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
                  <span className="text-white dark:text-black font-black text-xl">
                    {logoChar}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                  {projectName}
                </h1>
              </div>

              <div className="flex items-center space-x-3">
                <Link
                  to="/creator-register"
                  className="hidden sm:flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-all"
                >
                  <span>Ser Criador</span>
                </Link>
                <Link
                  to="/profile"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <button
                  onClick={toggleDiscreetMode}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {discreetMode ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="pb-4 space-y-3">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar criadores..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter + Sort */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm border border-slate-200 dark:border-slate-800"
                >
                  <option value="popular">Popular</option>
                  <option value="trending">Em Alta</option>
                  <option value="price-low">Menor Preço</option>
                  <option value="price-high">Maior Preço</option>
                  <option value="new">Novos</option>
                </select>
              </div>

              {/* Filter panel */}
              {showFilters && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Filtros Avançados
                    </h3>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-red-500 font-medium"
                      >
                        Limpar tudo
                      </button>
                    )}
                  </div>
                  <div className="space-y-5">
                    {Object.entries(FILTER_CATEGORIES).map(
                      ([key, category]) => (
                        <div key={key}>
                          <div className="flex items-center space-x-2 mb-3">
                            <span>{category.icon}</span>
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {category.label}
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {category.options.map((option) => (
                              <button
                                key={option}
                                onClick={() => toggleFilter(key, option)}
                                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${
                                  selectedFilters[key].includes(option)
                                    ? 'bg-black text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Active filter chips */}
              {activeFiltersCount > 0 && !showFilters && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Object.entries(selectedFilters).map(([cat, vals]) =>
                    vals.map((val) => (
                      <button
                        key={`${cat}-${val}`}
                        onClick={() => toggleFilter(cat, val)}
                        className="flex items-center space-x-2 text-sm px-3 py-1.5 bg-black text-white rounded-lg whitespace-nowrap font-medium"
                      >
                        <span>{val}</span>
                        <span>✕</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 -mb-px">
              {[
                { key: 'creators', label: 'Criadores' },
                { key: 'feed', label: 'Feed' },
                { key: 'lives', label: 'Lives' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-black dark:border-white text-black dark:text-white'
                      : 'border-transparent text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'lives' && liveCreators.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                      {liveCreators.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ─── Stories ─── */}
        {creators.filter((c) => c.hasStory).length > 0 && (
          <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex gap-4 overflow-x-auto">
                {creators
                  .filter((c) => c.hasStory)
                  .map((creator) => (
                    <button
                      key={`story-${creator.id || creator._id}`}
                      className="flex flex-col items-center space-y-2 flex-shrink-0"
                    >
                      <div
                        className={`w-16 h-16 rounded-full p-0.5 ${
                          creator.isLive
                            ? 'bg-red-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        <img
                          src={creator.avatar || '/default-avatar.png'}
                          alt={creator.displayName}
                          className="w-full h-full rounded-full border-2 border-white dark:border-slate-950 object-cover"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[64px] truncate">
                        {creator.displayName}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Main Content ─── */}
        <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
          {/* === CREATORS === */}
          {activeTab === 'creators' && (
            <>
              {loading && page === 1 && <LoadingSkeleton />}
              {error && page === 1 && !loading && <ErrorDisplay />}

              {!loading && !error && (
                <>
                  <div className="mb-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {filteredCreators.length}{' '}
                      {filteredCreators.length === 1
                        ? 'criador encontrado'
                        : 'criadores encontrados'}
                      {totalCreators > filteredCreators.length &&
                        ` de ${totalCreators}`}
                    </p>
                  </div>

                  {filteredCreators.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredCreators.map((creator) => (
                        <Link
                          key={creator.id || creator._id}
                          to={`/creator/${creator.id || creator._id}`}
                          className="group"
                        >
                          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-black dark:hover:border-white transition-all hover:shadow-xl">
                            <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                              <img
                                src={
                                  creator.avatar || '/default-avatar.png'
                                }
                                alt={creator.displayName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {creator.isVerified && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center shadow-lg">
                                  <span className="text-white dark:text-black text-xs">
                                    ✓
                                  </span>
                                </div>
                              )}
                              {creator.isLive && (
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md font-bold flex items-center space-x-1">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                  <span>LIVE</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate mb-1">
                                {creator.displayName}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">
                                @{creator.username}
                              </p>
                              {creator.tags && creator.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {creator.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-baseline justify-between">
                                <span className="text-base font-bold text-black dark:text-white">
                                  {formatPrice(
                                    creator.subscriptionPrice ??
                                      creator.price ??
                                      0,
                                    creator.currency
                                  )}
                                </span>
                                <span className="text-xs text-slate-500">
                                  /mês
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                {formatNumber(creator.subscribers || 0)}{' '}
                                assinantes
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        Nenhum criador encontrado
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Tente ajustar seus filtros
                      </p>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-4 px-4 py-2 text-sm font-bold rounded-md text-white bg-black"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>
                  )}

                  {hasMore && filteredCreators.length > 0 && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                      >
                        {loading ? 'Carregando...' : 'Carregar mais'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* === FEED === */}
          {activeTab === 'feed' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {feedLoading && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500">Carregando feed...</p>
                </div>
              )}

              {feedError && (
                <div className="text-center py-12">
                  <p className="text-red-500">{feedError}</p>
                </div>
              )}

              {!feedLoading && !feedError && feedPosts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-500">
                    Nenhum post encontrado no feed.
                  </p>
                </div>
              )}

              {feedPosts.map((post) => {
                const postId = post.id || post._id;
                return (
                  <div
                    key={postId}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    {/* Post header */}
                    <div className="flex items-center p-4 space-x-3">
                      <img
                        src={
                          post.creator?.avatar || '/default-avatar.png'
                        }
                        alt={post.creator?.displayName || 'Criador'}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                          {post.creator?.displayName || 'Criador'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleString()
                            : ''}
                        </p>
                      </div>
                    </div>

                    {/* Post media */}
                    {post.media && post.media.length > 0 && (
                      <div
                        className="relative cursor-pointer"
                        onClick={() => {
                          setViewerImages(post.media.map((m) => m.url));
                          setViewerInitialIndex(0);
                          setShowImageViewer(true);
                        }}
                      >
                        <img
                          src={post.media[0].url}
                          alt="Post"
                          className="w-full aspect-square object-cover"
                        />
                        {post.isExclusive && (
                          <div className="absolute top-4 right-4 bg-black/80 text-white text-xs px-3 py-1 rounded-full font-bold">
                            Exclusivo
                          </div>
                        )}
                      </div>
                    )}

                    {/* Post footer */}
                    <div className="p-4">
                      <div className="flex items-center space-x-4 mb-4">
                        <LikeButton
                          postId={postId}
                          initialLiked={post.isLiked}
                          initialCount={post.likes}
                          onLikeChange={() => {}}
                        />
                        <button
                          onClick={() =>
                            setShowComments((prev) => ({
                              ...prev,
                              [postId]: !prev[postId],
                            }))
                          }
                          className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                        >
                          <span>💬</span>
                          <span className="text-sm font-medium">
                            {post.commentsCount || 0}
                          </span>
                        </button>
                      </div>

                      {showComments[postId] && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <CommentSection
                            postId={postId}
                            creatorId={post.creator?.id}
                            currentUserId={currentUserId}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* === LIVES === */}
          {activeTab === 'lives' && (
            <>
              {liveCreators.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveCreators.map((creator) => (
                    <div
                      key={creator.id || creator._id}
                      className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border-2 border-red-200 dark:border-red-900"
                    >
                      <div className="relative">
                        <img
                          src={creator.avatar || '/default-avatar.png'}
                          alt="Live"
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
                          <div className="absolute top-4 left-4 bg-red-600 text-white text-sm px-3 py-1.5 rounded-md font-bold flex items-center space-x-2">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <span>AO VIVO</span>
                          </div>
                          <button className="bg-white text-black px-6 py-3 rounded-lg font-bold">
                            Assistir Agora
                          </button>
                        </div>
                      </div>
                      <div className="p-4 flex items-center space-x-3">
                        <img
                          src={creator.avatar || '/default-avatar.png'}
                          alt={creator.displayName}
                          className="w-10 h-10 rounded-full border-2 border-red-500"
                        />
                        <div>
                          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                            {creator.displayName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {formatNumber(creator.viewersCount || 0)}{' '}
                            assistindo
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                    Nenhuma live no momento
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Volte mais tarde
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <RightSidebar />

      {/* Image Viewer */}
      {showImageViewer && (
        <ImageViewer
          images={viewerImages}
          initialIndex={viewerInitialIndex}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </div>
  );
}

export default HomePage;