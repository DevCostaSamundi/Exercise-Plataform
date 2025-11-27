import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { creatorsAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';

// Mock de posts recentes (keep for feed tab)
const mockRecentPosts = [
  { id: 1, creatorId: 1, image: 'https://placehold.co/300x300/8B7FE8/white?text=Post1', likes: 120, comments: 15, isExclusive: true },
  { id: 2, creatorId: 2, image: 'https://placehold.co/300x300/6366F1/white?text=Post2', likes: 85, comments: 8, isExclusive: false },
  { id: 3, creatorId: 4, image: 'https://placehold.co/300x300/EC4899/white?text=Post3', likes: 200, comments: 25, isExclusive: true },
];

// Configuração de filtros categorizados
const FILTER_CATEGORIES = {
  genderIdentity: {
    label: 'Identidade de Gênero',
    icon: '🏳️‍⚧️',
    options: ['Trans mulher', 'Trans homem', 'Não-binário', 'Cis homem', 'Cis mulher', 'Queer', 'Gênero fluido'],
    color: 'indigo'
  },
  orientation: {
    label: 'Orientação',
    icon: '🏳️‍🌈',
    options: ['Gay', 'Lésbica', 'Bissexual', 'Pansexual', 'Assexual', 'Queer'],
    color: 'purple'
  },
  contentType: {
    label: 'Tipo de Conteúdo',
    icon: '📸',
    options: ['Fotos artísticas', 'Vídeos curtos', 'Lives interativas', 'Chat personalizado', 'Voz / áudio sensual', 'Conteúdo educativo'],
    color: 'violet'
  },
  aesthetic: {
    label: 'Estética / Vibe',
    icon: '✨',
    options: ['Sensual', 'Fetichista', 'Natural', 'Drag / Performance', 'Fitness', 'Adorável', 'Dominante', 'Submisso'],
    color: 'pink'
  }
};

const formatPrice = (price, currency = 'BRL') => {
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(price);
};

const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    genderIdentity: [],
    orientation: [],
    contentType: [],
    aesthetic: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [creators, setCreators] = useState([]);
  const [activeTab, setActiveTab] = useState('creators');
  const [sortBy, setSortBy] = useState('popular');
  
  // API state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCreators, setTotalCreators] = useState(0);
  
  // Ref for debounce timer
  const searchTimerRef = useRef(null);

  // Modo discreto - Initialize from localStorage without setState in effect
  const [discreetMode, setDiscreetMode] = useState(() => {
    return localStorage.getItem('discreetMode') === 'true';
  });

  // Save discreet mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('discreetMode', discreetMode);
  }, [discreetMode]);

  // Function to fetch creators from API
  const fetchCreators = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pageNum,
        limit: 12,
        verified: selectedFilters.genderIdentity.length > 0 || 
                 selectedFilters.orientation.length > 0 ||
                 selectedFilters.contentType.length > 0 ||
                 selectedFilters.aesthetic.length > 0 ? undefined : undefined,
      };

      // Add search if exists
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await creatorsAPI.getAll(params);
      const data = response.data;
      
      // Map API response to expected format
      const mappedCreators = (data.items || data.data || []).map(creator => ({
        id: creator.id,
        _id: creator.id,
        username: creator.user?.username || creator.username || 'unknown',
        displayName: creator.displayName || creator.user?.username || 'Criador',
        category: 'Conteúdo',
        price: creator.subscriptionPrice || 0,
        subscriptionPrice: creator.subscriptionPrice || 0,
        currency: 'BRL',
        avatar: creator.user?.avatar || creator.avatar || `https://placehold.co/100x100/8B7FE8/white?text=${(creator.displayName || 'C').charAt(0)}`,
        isVerified: creator.isVerified || false,
        hasStory: false,
        tags: [],
        genderIdentity: '',
        orientation: '',
        contentType: [],
        aesthetic: [],
        isLive: false,
        lastPost: '',
        subscribers: creator.followersCount || 0,
        description: creator.description || '',
      }));

      if (append) {
        setCreators(prev => [...prev, ...mappedCreators]);
      } else {
        setCreators(mappedCreators);
      }
      
      // Handle pagination info
      const pagination = data.pagination || {};
      setTotalCreators(pagination.total || mappedCreators.length);
      setHasMore(pagination.hasNext || (mappedCreators.length >= 12 && pageNum * 12 < (pagination.total || 100)));
      
    } catch (err) {
      console.error('Erro ao carregar criadores:', err);
      setError('Erro ao carregar criadores. Tente novamente.');
      if (!append) {
        setCreators([]);
      }
    } finally {
      setLoading(false);
    }
  }, [search, selectedFilters]);

  // Initial fetch
  useEffect(() => {
    fetchCreators(1, false);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      fetchCreators(1, false);
    }, 500);
    
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [search]);

  // Refetch when filters change
  useEffect(() => {
    setPage(1);
    fetchCreators(1, false);
  }, [selectedFilters]);

  // Handle load more
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCreators(nextPage, true);
  };

  // Handle retry
  const handleRetry = () => {
    setPage(1);
    fetchCreators(1, false);
  };

  // Client-side filtering (applied after API results)
  const filteredCreators = creators
    .filter(creator => {
      const matchesGender = selectedFilters.genderIdentity.length === 0 ||
        selectedFilters.genderIdentity.includes(creator.genderIdentity);

      const matchesOrientation = selectedFilters.orientation.length === 0 ||
        selectedFilters.orientation.includes(creator.orientation);

      const matchesContentType = selectedFilters.contentType.length === 0 ||
        (creator.contentType && selectedFilters.contentType.some(type => creator.contentType.includes(type)));

      const matchesAesthetic = selectedFilters.aesthetic.length === 0 ||
        (creator.aesthetic && selectedFilters.aesthetic.some(aes => creator.aesthetic.includes(aes)));

      return matchesGender && matchesOrientation && matchesContentType && matchesAesthetic;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'new':
          return (b.id || '').localeCompare(a.id || '');
        case 'trending':
          return b.subscribers - a.subscribers;
        default:
          return 0;
      }
    });

  const toggleFilter = (category, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      genderIdentity: [],
      orientation: [],
      contentType: [],
      aesthetic: []
    });
    setSearch('');
  };

  const activeFiltersCount = Object.values(selectedFilters).flat().length;
  const liveCreators = creators.filter(c => c.isLive);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden">
            <div className="aspect-square bg-slate-300 dark:bg-slate-700"></div>
            <div className="p-3 space-y-2">
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
              <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3 mt-2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error component
  const ErrorDisplay = () => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mt-4 mb-2">Erro ao carregar</h3>
      <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
      <button
        onClick={handleRetry}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      {/* Header Clean & Minimal */}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
            {/* Top Bar */}
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-xl">P</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {discreetMode ? 'Portal' : 'PrideConnect'}
                </h1>
              </div>

              {/* Right Actions */}
              <div className="flex items-center space-x-3">
                {/* Become Creator */}
                <Link
                  to="/creator-register"
                  className="hidden sm:flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  <span>Ser Criador</span>
                </Link>

                {/* Notifications */}
                <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full"></span>
                </button>

                {/* Profile */}
                <Link to="/Creator/Profile" className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </Link>

                {/* Discreet Mode */}
                <button
                  onClick={() => setDiscreetMode(!discreetMode)}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {discreetMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="pb-4 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar criadores..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filter & Sort Controls */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${showFilters || activeFiltersCount > 0
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
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
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                >
                  <option value="popular">Popular</option>
                  <option value="trending">Em Alta</option>
                  <option value="price-low">Menor Preço</option>
                  <option value="price-high">Maior Preço</option>
                  <option value="new">Novos</option>
                </select>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 animate-slideDown">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Filtros Avançados</h3>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Limpar tudo
                      </button>
                    )}
                  </div>

                  <div className="space-y-5">
                    {Object.entries(FILTER_CATEGORIES).map(([key, category]) => (
                      <div key={key}>
                        <div className="flex items-center space-x-2 mb-3">
                          <span>{category.icon}</span>
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">{category.label}</h4>
                          {selectedFilters[key].length > 0 && (
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                              {selectedFilters[key].length}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {category.options.map(option => (
                            <button
                              key={option}
                              onClick={() => toggleFilter(key, option)}
                              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${selectedFilters[key].includes(option)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filter Chips */}
              {activeFiltersCount > 0 && !showFilters && (
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {Object.entries(selectedFilters).map(([category, values]) =>
                    values.map(value => (
                      <button
                        key={`${category}-${value}`}
                        onClick={() => toggleFilter(category, value)}
                        className="flex items-center space-x-2 text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg whitespace-nowrap font-medium hover:bg-indigo-700 transition-colors"
                      >
                        <span>{value}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 -mb-px">
              <button
                onClick={() => setActiveTab('creators')}
                className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'creators'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>Criadores</span>
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'feed'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                <span>Feed</span>
              </button>
              <button
                onClick={() => setActiveTab('lives')}
                className={`flex items-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors relative ${activeTab === 'lives'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span>Lives</span>
                {liveCreators.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {liveCreators.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Stories */}
        <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-4 overflow-x-auto hide-scrollbar">
              {creators.filter(c => c.hasStory).map(creator => (
                <button key={`story-${creator.id}`} className="flex flex-col items-center space-y-2 flex-shrink-0 group">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-full p-0.5 ${creator.isLive ? 'bg-gradient-to-tr from-red-500 to-pink-500' : 'bg-gradient-to-tr from-indigo-500 to-purple-500'}`}>
                      <img
                        src={creator.avatar}
                        alt={creator.displayName}
                        className="w-full h-full rounded-full border-2 border-white dark:border-slate-950 object-cover"
                      />
                    </div>
                    {creator.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[64px] truncate">
                    {creator.displayName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
          {activeTab === 'creators' && (
            <>
              {/* Initial Loading State */}
              {loading && page === 1 && <LoadingSkeleton />}

              {/* Error State */}
              {error && page === 1 && !loading && <ErrorDisplay />}

              {/* Content when loaded */}
              {!loading && !error && (
                <>
                  {/* Results Count */}
                  <div className="mb-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {filteredCreators.length} {filteredCreators.length === 1 ? 'criador encontrado' : 'criadores encontrados'}
                      {totalCreators > filteredCreators.length && ` de ${totalCreators}`}
                    </p>
                  </div>

                  {/* Creators Grid */}
                  {filteredCreators.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredCreators.map((creator) => (
                        <Link
                          key={creator.id}
                          to={`/creator/${creator.id}`}
                          className="group"
                        >
                          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-lg">
                            {/* Avatar */}
                            <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                              <img
                                src={creator.avatar}
                                alt={creator.displayName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />

                              {/* Verified Badge */}
                              {creator.isVerified && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}

                              {/* Live Badge */}
                              {creator.isLive && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-bold flex items-center space-x-1">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                  <span>LIVE</span>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-3">
                              <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate mb-1">
                                {creator.displayName}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">
                                @{creator.username}
                              </p>

                              {/* Tags */}
                              {creator.tags && creator.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {creator.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Price */}
                              <div className="flex items-baseline justify-between">
                                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                                  {formatPrice(creator.price, creator.currency)}
                                </span>
                                <span className="text-xs text-slate-500">/mês</span>
                              </div>

                              {/* Subscribers */}
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                {formatNumber(creator.subscribers)} assinantes
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {hasMore && filteredCreators.length > 0 && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                      >
                        {loading ? (
                          <span className="flex items-center space-x-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Carregando...</span>
                          </span>
                        ) : (
                          'Carregar mais'
                        )}
                      </button>
                    </div>
                  )}

                  {/* Empty State */}
                  {filteredCreators.length === 0 && (
                    <div className="text-center py-12">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">Nenhum criador encontrado</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tente ajustar seus filtros ou buscar por outro termo</p>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'feed' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {mockRecentPosts.map(post => {
                const creator = creators.find(c => c.id === post.creatorId);
                if (!creator) return null;
                return (
                  <div key={post.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {/* Post Header */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <img src={creator.avatar} alt={creator.displayName} className="w-10 h-10 rounded-full" />
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{creator.displayName}</h4>
                          <p className="text-xs text-slate-500">há 2 horas</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>

                    {/* Post Image */}
                    <div className="relative">
                      <img src={post.image} alt="Post" className="w-full aspect-square object-cover" />
                      {post.isExclusive && (
                        <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                          Exclusivo
                        </div>
                      )}
                    </div>

                    {/* Post Footer */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="text-sm font-medium">{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm font-medium">{post.comments}</span>
                          </button>
                        </div>
                        <button className="text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'lives' && (
            <>
              {liveCreators.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveCreators.map(creator => (
                    <div key={creator.id} className="group">
                      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border-2 border-red-200 dark:border-red-900">
                        <div className="relative">
                          <img src={creator.lastPost} alt="Live" className="w-full aspect-video object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
                            <div className="absolute top-4 left-4 bg-red-500 text-white text-sm px-3 py-1.5 rounded-md font-bold flex items-center space-x-2">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                              <span>AO VIVO</span>
                            </div>
                            <button className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                              Assistir Agora
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <img src={creator.avatar} alt={creator.displayName} className="w-10 h-10 rounded-full border-2 border-red-500" />
                              <div>
                                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{creator.displayName}</h3>
                                <p className="text-xs text-slate-500">{creator.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium">1.2k</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">Nenhuma live ao vivo</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Volte mais tarde para ver conteúdo ao vivo!</p>
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3 text-2xl">
                <span>🔒</span>
                <span>🏳️‍🌈</span>
                <span>✨</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                {discreetMode
                  ? 'Plataforma segura e confidencial com criptografia end-to-end.'
                  : 'Pagamentos 100% discretos. Proteção total da sua privacidade. Espaço seguro para a comunidade LGBT+.'}
              </p>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                Feito com 💜 para a comunidade LGBT+
              </p>
              <div className="flex items-center justify-center space-x-6 text-xs text-slate-500 dark:text-slate-400 pt-4">
                <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400">Termos</Link>
                <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacidade</Link>
                <Link to="/dmca" className="hover:text-indigo-600 dark:hover:text-indigo-400">DMCA</Link>
                <Link to="/support" className="hover:text-indigo-600 dark:hover:text-indigo-400">Suporte</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <RightSidebar />

      {/* Styles */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}