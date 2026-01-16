import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PaymentModal from '../../components/PaymentModal';
import TipModal from '../../components/TipModal';
import creatorService from '../../services/creatorService';
import subscriptionService from '../../services/subscriptionService';
import messageService from '../../services/messageService';

export default function CreatorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchCreatorData();
  }, [id]);

  const fetchCreatorData = async () => {
    setLoading(true);
    try {
      // Buscar perfil do criador
      const profileResponse = await creatorService.getCreatorProfile(id);

      if (profileResponse.success) {
        setCreator(profileResponse.data);

        // Buscar posts
        const postsResponse = await creatorService.getCreatorPosts(id, { limit: 20 });

        if (postsResponse.success) {
          setPosts(postsResponse.data);
          setIsSubscribed(postsResponse.isSubscribed || false);
        }
      }
    } catch (error) {
      console.error('Error fetching creator:', error);
      setCreator(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    if (! currentUser || !currentUser.id) {
      alert('Você precisa estar logado para assinar! ');
      navigate('/login');
      return;
    }

    setPaymentData({
      creatorId: creator.id,
      type: 'SUBSCRIPTION',
      amountUSD: creator.subscriptionPrice || 30,
    });
    setShowPaymentModal(true);
  };

  const handleSendMessage = async (creatorId) => {
    try {
      setLoading(true);
      
      // ✅ Criar ou buscar conversa
      const response = await messageService.getOrCreateConversation(creatorId);
      
      console.log('✅ Conversation created/found:', response);
      
      // ✅ Redirecionar para mensagens com o ID da conversa
      navigate(`/messages? conversation=${response.data.id}`);
      
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      alert('Erro ao iniciar conversa:  ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTip = () => {
    if (!currentUser || !currentUser.id) {
      alert('Você precisa estar logado para enviar gorjetas!');
      navigate('/login');
      return;
    }

    setShowTipModal(true);
  };

  const handleUnlockPost = (post) => {
    if (!currentUser || !currentUser. id) {
      alert('Você precisa estar logado para desbloquear conteúdo!');
      navigate('/login');
      return;
    }

    setSelectedPost(post);
    setPaymentData({
      creatorId: creator.id,
      postId: post.id,
      type: 'PPV_POST',
      amountUSD:  post.price || 5,
    });
    setShowPaymentModal(true);
  };

  const handleShareProfile = () => {
    if (! creator) return;
    
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Confira o perfil de ${creator.displayName}`,
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style:  'currency',
      currency,
    }).format(price);
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const filteredPosts = posts.filter(post => {
    if (filterType === 'all') return true;
    if (filterType === 'photos') return post.type === 'photo';
    if (filterType === 'videos') return post.type === 'video';
    return true;
  });

  const benefits = [
    { icon: '📸', title: 'Fotos Exclusivas', description: 'Conteúdo semanal em alta qualidade' },
    { icon: '🎥', title: 'Vídeos Premium', description: 'Vídeos de 1-5 minutos' },
    { icon: '💬', title: 'Chat Direto', description: 'Resposta em até 24h' },
    { icon: '🎨', title: 'Conteúdo Personalizado', description: 'Pedidos e enquetes exclusivas' },
  ];

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Criador não encontrado</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">O perfil que você está procurando não existe</p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header with Back Button */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg: px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9. 707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Voltar</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleShareProfile}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Compartilhar perfil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8. 684 13.342C8.886 12.938 9 12.482 9 12c0-. 482-. 114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6. 632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Mais opções"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Photo */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
        <img
          src={creator.cover}
          alt="Cover"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Subscription Badge */}
        {isSubscribed && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Assinante</span>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border-4 border-white dark:border-slate-950 overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-xl group-hover:scale-105 transition-transform">
                <img
                  src={creator.avatar}
                  alt={creator.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              {creator.isVerified && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Name & Stats */}
            <div className="flex-1 w-full">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-800">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark: text-white mb-1 flex items-center space-x-2">
                  <span>{creator.displayName}</span>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-3">@{creator.username}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 sm:gap-6 text-sm flex-wrap">
                  <div>
                    <span className="font-bold text-slate-900 dark: text-white">{creator.posts}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-1">Posts</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{formatNumber(creator.subscribers)}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-1">Assinantes</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{creator.photos}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-1">Fotos</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{creator.videos}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-1">Vídeos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark: border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark: text-white mb-3">Sobre</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4 whitespace-pre-line">{creator.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {creator.tags. map(tag => (
                  <span key={tag} className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-sm px-3 py-1 rounded-full font-medium">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 dark: text-slate-400 mb-1">Identidade</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{creator.genderIdentity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark: text-slate-400 mb-1">Orientação</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{creator. orientation}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Localização</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{creator. location}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Membro desde</p>
                  <p className="text-sm font-medium text-slate-900 dark: text-white">{creator.joinDate}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'posts'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'media'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover: text-slate-700 dark: text-slate-400 dark: hover:text-slate-300'
                    }`}
                >
                  Mídia ({creator.photos + creator.videos})
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'about'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover: text-slate-700 dark: text-slate-400 dark: hover:text-slate-300'
                    }`}
                >
                  Sobre
                </button>
              </div>
            </div>

            {/* Filter Buttons (apenas na aba media) */}
            {activeTab === 'media' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  Tudo
                </button>
                <button
                  onClick={() => setFilterType('photos')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'photos'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark: bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  📸 Fotos ({creator.photos})
                </button>
                <button
                  onClick={() => setFilterType('videos')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'videos'
                    ?  'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  🎥 Vídeos ({creator.videos})
                </button>
              </div>
            )}

            {/* Posts Grid */}
            {activeTab === 'posts' && (
              <>
                {filteredPosts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-slate-600 dark:text-slate-400">Nenhum post ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredPosts.map(post => (
                      <div
                        key={post.id}
                        className="relative aspect-square group cursor-pointer"
                        onClick={() => post.isLocked && ! isSubscribed && post.price ?  handleUnlockPost(post) : null}
                      >
                        <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <img
                            src={post.thumbnail}
                            alt={`Post ${post.id}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-4 text-white">
                              <div className="flex items-center space-x-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3. 172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">{post.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-. 98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">{post. comments}</span>
                              </div>
                            </div>
                          </div>

                          {/* Lock overlay for locked content */}
                          {post. isLocked && ! isSubscribed && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              <p className="text-white text-xs font-medium mb-2">Conteúdo bloqueado</p>
                              {post.price && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlockPost(post);
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded-full font-medium"
                                >
                                  Desbloquear por ${post.price}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Video indicator */}
                          {post. type === 'video' && (! post.isLocked || isSubscribed) && (
                            <div className="absolute top-2 right-2 bg-black/70 rounded-lg px-2 py-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9. 555 7.168A1 1 0 008 8v4a1 1 0 001. 555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredPosts.map(post => (
                  <div key={post.id} className="relative aspect-square group cursor-pointer">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <img
                        src={post.thumbnail}
                        alt={`Post ${post.id}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-4 text-white">
                          <div className="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">{post. likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">{post.comments}</span>
                          </div>
                        </div>
                      </div>

                      {/* Lock overlay */}
                      {post.isLocked && !isSubscribed && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <p className="text-white text-xs font-medium mb-2">Conteúdo bloqueado</p>
                          {post.price && (
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded-full font-medium">
                              Desbloquear por ${post.price}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Video indicator */}
                      {post.type === 'video' && (!post.isLocked || isSubscribed) && (
                        <div className="absolute top-2 right-2 bg-black/70 rounded-lg px-2 py-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Sobre {creator.displayName}</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 whitespace-pre-line">{creator.description}</p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Identidade de Gênero</p>
                      <p className="font-medium text-slate-900 dark:text-white">{creator.genderIdentity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Orientação Sexual</p>
                      <p className="font-medium text-slate-900 dark:text-white">{creator.orientation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Localização</p>
                      <p className="font-medium text-slate-900 dark: text-white">{creator.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Membro desde</p>
                      <p className="font-medium text-slate-900 dark:text-white">{creator.joinDate}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Categorias</p>
                    <div className="flex flex-wrap gap-2">
                      {creator.tags.map(tag => (
                        <span key={tag} className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-sm px-3 py-1 rounded-full font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Subscription Card */}
            {! isSubscribed ?  (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
                <div className="text-center mb-4">
                  <p className="text-sm font-medium opacity-90 mb-1">Assine por apenas</p>
                  <p className="text-4xl font-bold">{formatPrice(creator.subscriptionPrice || 30)}</p>
                  <p className="text-sm opacity-75">por mês</p>
                </div>

                <button
                  onClick={handleSubscribe}
                  className="w-full bg-white text-indigo-600 hover:bg-slate-50 py-3 px-6 rounded-lg font-semibold shadow-lg transition-all hover:shadow-xl mb-3"
                >
                  Assinar Agora
                </button>

                <div className="space-y-2 text-sm">
                  {benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-lg">{benefit. icon}</span>
                      <div>
                        <p className="font-semibold">{benefit.title}</p>
                        <p className="text-xs opacity-75">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Você é assinante! </h3>
                  <p className="text-sm text-slate-600 dark: text-slate-400">Aproveite todo o conteúdo exclusivo</p>
                </div>
              </div>
            )}

            {/* Redes Sociais */}
            {creator.socialLinks && Object.keys(creator.socialLinks).filter(key => creator.socialLinks[key]).length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2. 977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10. 895-1.789l-4.94-2.47a3.027 3.027 0 000-. 74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  <span>Redes Sociais</span>
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {creator.socialLinks.twitter && (
                    <a
                      href={creator.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-4 rounded-lg transition-colors"
                    >
                      <span className="text-xl">𝕏</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Twitter</span>
                    </a>
                  )}

                  {creator.socialLinks. instagram && (
                    <a
                      href={creator.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-3 px-4 rounded-lg transition-all text-white"
                    >
                      <span className="text-xl">📸</span>
                      <span className="text-sm font-medium">Instagram</span>
                    </a>
                  )}

                  {creator.socialLinks.tiktok && (
                    <a
                      href={creator. socialLinks.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 py-3 px-4 rounded-lg transition-colors"
                    >
                      <span className="text-xl">🎵</span>
                      <span className="text-sm font-medium text-white dark:text-slate-900">TikTok</span>
                    </a>
                  )}

                  {creator.socialLinks. youtube && (
                    <a
                      href={creator.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 py-3 px-4 rounded-lg transition-colors text-white"
                    >
                      <span className="text-xl">▶️</span>
                      <span className="text-sm font-medium">YouTube</span>
                    </a>
                  )}

                  {creator.website && (
                    <a
                      href={creator.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 bg-indigo-100 dark:bg-indigo-900/20 hover:bg-indigo-200 dark:hover:bg-indigo-900/30 py-3 px-4 rounded-lg transition-colors"
                    >
                      <span className="text-xl">🌐</span>
                      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Website</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <button
                onClick={() => handleSendMessage(creator.userId)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span>Enviar Mensagem</span>
              </button>

              <button
                onClick={handleSendTip}
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-. 267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12. 849v-1.698c. 22. 071.412.164.567.267.364.243. 433.468.433.582 0.114-. 07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v. 092a4.535 4.535 0 00-1.676. 662C6.602 6.234 6 7.009 6 8c0.99. 602 1.765 1.324 2.246. 48.32 1.054.545 1.676.662v1.941c-. 391-. 127-.68-.317-. 843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-. 092a4.535 4.535 0 001.676-. 662C13.398 13.766 14 12.991 14 12c0-. 99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7. 151c. 391.127.68.317.843.504a1 1 0 101.511-1.31c-. 563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <span>Enviar Gorjeta</span>
              </button>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Estatísticas</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total de Posts</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{creator.posts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Fotos</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{creator.photos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark: text-slate-400">Vídeos</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{creator. videos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Assinantes</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(creator.subscribers)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          paymentData={paymentData}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentData(null);
            setSelectedPost(null);
          }}
          onSuccess={(payment) => {
            console.log('✅ Payment successful:', payment);
            setShowPaymentModal(false);
            setPaymentData(null);
            setSelectedPost(null);
            
            // Atualizar status de assinatura se foi SUBSCRIPTION
            if (paymentData.type === 'SUBSCRIPTION') {
              setIsSubscribed(true);
            }
            
            // Recarregar dados do criador
            fetchCreatorData();
          }}
        />
      )}

      {showTipModal && (
        <TipModal
          isOpen={showTipModal}
          creator={{
            id: creator.id,
            displayName: creator.displayName,
            avatar: creator.avatar,
            username: creator.username,
          }}
          onClose={() => setShowTipModal(false)}
          onSuccess={() => {
            setShowTipModal(false);
            alert('Gorjeta enviada com sucesso!  🎉');
          }}
        />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 animate-pulse">
      <div className="h-16 bg-slate-200 dark:bg-slate-800"></div>
      <div className="h-64 bg-slate-200 dark:bg-slate-800"></div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 mb-6">
          <div className="flex items-end gap-4">
            <div className="w-40 h-40 bg-slate-300 dark:bg-slate-700 rounded-2xl"></div>
            <div className="flex-1 h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="grid grid-cols-3 gap-3">
              {[... Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}