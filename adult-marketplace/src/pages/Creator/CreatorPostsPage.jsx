import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import CreatorSidebar from '../../components/CreatorSidebar';

export default function CreatorPostsPage() {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState('all'); // all, published, scheduled, draft
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Mostrar mensagem de sucesso se veio do upload
  useState(() => {
    if (location.state?.message) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, []);

  // Mock data (em produção viria da API)
  const mockPosts = [
    {
      id: 1,
      title: 'Ensaio fotográfico sensual 🔥',
      description: 'Novos clicks exclusivos do último ensaio...',
      thumbnail: 'https://placehold.co/300x300/8B7FE8/white?text=Post1',
      type: 'photo',
      status: 'published',
      visibility: 'subscribers',
      likes: 342,
      comments: 45,
      views: 1250,
      earnings: 0,
      publishedAt: '2025-11-20T10:30:00',
      createdAt: '2025-11-20T09:15:00',
      mediaCount: 8,
      tags: ['Sensual', 'Artístico'],
    },
    {
      id: 2,
      title: 'Vídeo exclusivo - Behind the scenes',
      description: 'Bastidores da última sessão de fotos',
      thumbnail: 'https://placehold.co/300x300/6366F1/white?text=Post2',
      type: 'video',
      status: 'published',
      visibility: 'premium',
      price: 15.90,
      likes: 298,
      comments: 38,
      views: 890,
      earnings: 238.50,
      publishedAt: '2025-11-19T15:00:00',
      createdAt: '2025-11-19T14:00:00',
      mediaCount: 1,
      tags: ['Behind the scenes', 'Exclusivo'],
    },
    {
      id: 3,
      title: 'Fotos do treino de hoje 💪',
      description: 'Compartilhando minha rotina fitness com vocês',
      thumbnail: 'https://placehold.co/300x300/EC4899/white?text=Post3',
      type: 'photo',
      status: 'scheduled',
      visibility: 'subscribers',
      likes: 0,
      comments: 0,
      views: 0,
      earnings: 0,
      scheduledFor: '2025-11-22T18:00:00',
      createdAt: '2025-11-21T10:00:00',
      mediaCount: 5,
      tags: ['Fitness', 'Lifestyle'],
    },
    {
      id: 4,
      title: 'Teaser gratuito - Preview do próximo conteúdo',
      description: 'Uma prévia do que está por vir...',
      thumbnail: 'https://placehold.co/300x300/A78BFA/white?text=Post4',
      type: 'photo',
      status: 'published',
      visibility: 'free',
      likes: 567,
      comments: 89,
      views: 3420,
      earnings: 0,
      publishedAt: '2025-11-18T12:00:00',
      createdAt: '2025-11-18T11:30:00',
      mediaCount: 3,
      tags: ['Teaser', 'Gratuito'],
    },
    {
      id: 5,
      title: 'Áudio sensual personalizado 🎙️',
      description: 'Mensagem especial para meus assinantes',
      thumbnail: 'https://placehold.co/300x300/8B5CF6/white?text=Audio',
      type: 'audio',
      status: 'draft',
      visibility: 'subscribers',
      likes: 0,
      comments: 0,
      views: 0,
      earnings: 0,
      createdAt: '2025-11-21T08:00:00',
      mediaCount: 1,
      tags: ['Áudio', 'Personalizado'],
    },
  ];

  const filteredPosts = mockPosts.filter(post => {
    if (activeFilter === 'all') return true;
    return post.status === activeFilter;
  });

  const stats = {
    all: mockPosts.length,
    published: mockPosts.filter(p => p.status === 'published').length,
    scheduled: mockPosts.filter(p => p.status === 'scheduled').length,
    draft: mockPosts.filter(p => p.status === 'draft').length,
  };

  const handleSelectPost = (id) => {
    setSelectedPosts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map(p => p.id));
    }
  };

  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    // TODO: Integrar com API
    await new Promise(resolve => setTimeout(resolve, 500));
    setShowDeleteModal(false);
    setPostToDelete(null);
    // Mostrar mensagem de sucesso
    alert(`Post "${postToDelete.title}" deletado com sucesso!`);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Deletar ${selectedPosts.length} post(s) selecionado(s)?`)) {
      // TODO: Integrar com API
      await new Promise(resolve => setTimeout(resolve, 500));
      setSelectedPosts([]);
      alert('Posts deletados com sucesso!');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `Há ${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      published: { label: 'Publicado', color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
      scheduled: { label: 'Agendado', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
      draft: { label: 'Rascunho', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400' },
    };
    return badges[status];
  };

  const getVisibilityIcon = (visibility) => {
    const icons = {
      subscribers: '🔒',
      premium: '💎',
      free: '🌐',
    };
    return icons[visibility];
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <CreatorSidebar />
      {/* Header */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                <Link
                  to="/creator/dashboard"
                  className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">Meus Posts</h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{filteredPosts.length} post(s)</p>
                </div>
              </div>

              <Link
                to="/creator/upload"
                className="flex items-center space-x-1 sm:space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Novo Post</span>
                <span className="sm:hidden">Novo</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Success Message */}
        {showSuccessMessage && location.state?.message && (
          <div className="flex flex-1 w-full px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{location.state.message}</span>
              </div>
              <button onClick={() => setShowSuccessMessage(false)} className="text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Filters & Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar w-full sm:w-auto pb-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  Todos ({stats.all})
                </button>
                <button
                  onClick={() => setActiveFilter('published')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeFilter === 'published'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  Publicados ({stats.published})
                </button>
                <button
                  onClick={() => setActiveFilter('scheduled')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeFilter === 'scheduled'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  Agendados ({stats.scheduled})
                </button>
                <button
                  onClick={() => setActiveFilter('draft')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeFilter === 'draft'
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  Rascunhos ({stats.draft})
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                      ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                      ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedPosts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedPosts.length} selecionado(s)
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                  >
                    Deletar selecionados
                  </button>
                </div>
                <button
                  onClick={() => setSelectedPosts([])}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Limpar seleção
                </button>
              </div>
            )}
          </div>

          {/* Posts Grid/List */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Nenhum post {activeFilter !== 'all' && getStatusBadge(activeFilter).label.toLowerCase()}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Comece criando seu primeiro post para compartilhar com seus assinantes
              </p>
              <Link
                to="/creator/upload"
                className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Criar Primeiro Post</span>
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                    {post.type === 'audio' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <p className="text-sm text-slate-500">Áudio</p>
                      </div>
                    ) : (
                      <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-white text-sm">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            {formatNumber(post.likes)}
                          </span>
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            {formatNumber(post.comments)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Selection Checkbox */}
                    <div className="absolute top-3 left-3">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => handleSelectPost(post.id)}
                        className="w-5 h-5 text-indigo-600 bg-white border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusBadge(post.status).color}`}>
                        {getStatusBadge(post.status).label}
                      </span>
                    </div>

                    {/* Type & Visibility */}
                    <div className="absolute bottom-3 left-3 flex items-center space-x-1">
                      {post.type === 'video' && (
                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">🎥</span>
                      )}
                      {post.type === 'photo' && post.mediaCount > 1 && (
                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">📷 {post.mediaCount}</span>
                      )}
                      <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {getVisibilityIcon(post.visibility)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{post.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{post.description}</p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        {formatNumber(post.views)} views
                      </span>
                      {post.status === 'published' && (
                        <span>{formatDate(post.publishedAt)}</span>
                      )}
                      {post.status === 'scheduled' && (
                        <span className="text-blue-600 dark:text-blue-400">
                          {new Date(post.scheduledFor).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Earnings (if PPV) */}
                    {post.visibility === 'premium' && post.earnings > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 mb-3">
                        <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                          💰 Ganhos: {formatCurrency(post.earnings)}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/creator/posts/${post.id}/edit`}
                        className="flex-1 flex items-center justify-center space-x-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        <span>Editar</span>
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(post)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                          onChange={handleSelectAll}
                          className="w-5 h-5 text-indigo-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Post
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Engajamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ganhos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPosts.includes(post.id)}
                            onChange={() => handleSelectPost(post.id)}
                            className="w-5 h-5 text-indigo-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                              {post.type === 'audio' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                  </svg>
                                </div>
                              ) : (
                                <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">{post.title}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{post.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-slate-500">
                                  {getVisibilityIcon(post.visibility)}
                                </span>
                                {post.tags && post.tags.length > 0 && (
                                  <span className="text-xs text-slate-500">• {post.tags[0]}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded ${getStatusBadge(post.status).color}`}>
                            {getStatusBadge(post.status).label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1 text-sm">
                            <div className="flex items-center text-slate-600 dark:text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              {formatNumber(post.likes)}
                            </div>
                            <div className="flex items-center text-slate-600 dark:text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              {formatNumber(post.views)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {post.earnings > 0 ? (
                            <span className="font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(post.earnings)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {post.status === 'published' && formatDate(post.publishedAt)}
                          {post.status === 'scheduled' && (
                            <span className="text-blue-600 dark:text-blue-400">
                              {new Date(post.scheduledFor).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                          {post.status === 'draft' && 'Rascunho'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/creator/posts/${post.id}/edit`}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(post)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Delete Modal */}
        {showDeleteModal && postToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
                Deletar Post?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                Tem certeza que deseja deletar <strong>"{postToDelete.title}"</strong>? Esta ação não pode ser desfeita.
              </p>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      </div>
    </div>
  );
}