import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function CreatorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts'); // posts, about, media

  // Simulando dados do criador (em produção, viria de uma API)
  const creator = {
    id,
    username: 'luna.oficial',
    displayName: 'Luna',
    bio: 'Artista multidisciplinar, criando conteúdo autêntico e sensual com foco em empoderamento. 🏳️‍⚧️✨',
    description: 'Bem-vindo ao meu espaço exclusivo! Aqui você encontra conteúdo autêntico, arte sensual e muito mais. Sou apaixonada por fotografia, performance e expressão corporal. Vamos criar uma conexão especial juntos! 💜',
    price: 24.9,
    currency: 'BRL',
    avatar: 'https://placehold.co/200x200/8B7FE8/white?text=Luna',
    cover: 'https://placehold.co/1200x400/6366F1/white?text=Cover',
    isVerified: true,
    subscribers: 1240,
    posts: 156,
    photos: 89,
    videos: 67,
    tags: ['trans', 'sensual', 'artístico', 'empoderamento'],
    genderIdentity: 'Trans mulher',
    orientation: 'Lésbica',
    location: 'São Paulo, Brasil',
    joinDate: 'Março 2024',
    socialLinks: {
      instagram: '@luna.oficial',
      twitter: '@luna_art',
    }
  };

  // Posts de exemplo
  const posts = [
    { id: 1, type: 'photo', thumbnail: 'https://placehold.co/300x300/8B7FE8/white?text=Post1', likes: 145, comments: 12, isLocked: false },
    { id: 2, type: 'video', thumbnail: 'https://placehold.co/300x300/6366F1/white?text=Post2', likes: 203, comments: 28, isLocked: true },
    { id: 3, type: 'photo', thumbnail: 'https://placehold.co/300x300/A78BFA/white?text=Post3', likes: 167, comments: 15, isLocked: false },
    { id: 4, type: 'video', thumbnail: 'https://placehold.co/300x300/EC4899/white?text=Post4', likes: 312, comments: 45, isLocked: true },
    { id: 5, type: 'photo', thumbnail: 'https://placehold.co/300x300/8B5CF6/white?text=Post5', likes: 189, comments: 19, isLocked: true },
    { id: 6, type: 'photo', thumbnail: 'https://placehold.co/300x300/F97316/white?text=Post6', likes: 221, comments: 31, isLocked: false },
  ];

  const benefits = [
    { icon: '📸', title: 'Fotos Exclusivas', description: 'Conteúdo semanal em alta qualidade' },
    { icon: '🎥', title: 'Vídeos Premium', description: 'Vídeos de 1-5 minutos' },
    { icon: '💬', title: 'Chat Direto', description: 'Resposta em até 24h' },
    { icon: '🎨', title: 'Conteúdo Personalizado', description: 'Pedidos e enquetes exclusivas' },
  ];

  const handleSubscribe = () => {
    // Aqui você integraria PIX ou outro gateway
    alert('🔒 Integração com pagamento via PIX será implementada aqui! (MVP)');
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header with Back Button */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Voltar</span>
            </button>

            <div className="flex items-center space-x-3">
              <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
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
      </div>

      {/* Profile Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border-4 border-white dark:border-slate-950 overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-xl">
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
            <div className="flex-1">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {creator.displayName}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-3">@{creator.username}</p>
                
                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{creator.posts}</span>
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
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Sobre</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{creator.description}</p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {creator.tags.map(tag => (
                  <span key={tag} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Identidade</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{creator.genderIdentity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Orientação</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{creator.orientation}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Localização</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{creator.location}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Membro desde</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{creator.joinDate}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'posts'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'media'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  Mídia
                </button>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {posts.map(post => (
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
                          <span className="text-sm font-medium">{post.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">{post.comments}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lock overlay for locked content */}
                    {post.isLocked && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <p className="text-white text-xs font-medium">Assine para ver</p>
                      </div>
                    )}

                    {/* Video indicator */}
                    {post.type === 'video' && !post.isLocked && (
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Subscribe Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sticky top-20">
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Assinatura mensal</p>
                <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatPrice(creator.price, creator.currency)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">por mês</p>
              </div>

              <button
                onClick={handleSubscribe}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors mb-3 flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Assinar Agora</span>
              </button>

              <button className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Enviar Mensagem</span>
              </button>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">O que está incluso:</h3>
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="text-2xl flex-shrink-0">{benefit.icon}</span>
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{benefit.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  🔒 Pagamento seguro e discreto via PIX
                </p>
              </div>
            </div>

            {/* Social Links */}
            {creator.socialLinks && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Redes Sociais</h3>
                <div className="space-y-2">
                  {creator.socialLinks.instagram && (
                    <a href="#" className="flex items-center space-x-3 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span className="text-sm">{creator.socialLinks.instagram}</span>
                    </a>
                  )}
                  {creator.socialLinks.twitter && (
                    <a href="#" className="flex items-center space-x-3 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      <span className="text-sm">{creator.socialLinks.twitter}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}