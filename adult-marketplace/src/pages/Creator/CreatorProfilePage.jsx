import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PaymentModal from '../../components/PaymentModal.jsx';

export default function CreatorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts'); // posts, about, media
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  // Validar se ID existe
  useEffect(() => {
    if (!id || id === 'undefined') {
      setError('ID do criador inválido');
      setIsLoading(false);
      return;
    }

    const fetchCreatorData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch creator profile
        const creatorRes = await fetch(
          `http://localhost:5000/api/v1/creators/${id}`,
          {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!creatorRes.ok) {
          if (creatorRes.status === 404) {
            setError('Criador não encontrado');
          } else if (creatorRes.status === 400) {
            setError('ID do criador inválido');
          } else {
            setError('Erro ao carregar perfil do criador');
          }
          setIsLoading(false);
          return;
        }

        const creatorData = await creatorRes.json();

        if (!creatorData.data) {
          setError('Dados do criador inválidos');
          setIsLoading(false);
          return;
        }

        setCreator(creatorData.data);

        // Fetch creator posts
        try {
          const postsRes = await fetch(
            `http://localhost:5000/api/v1/creators/${id}/posts?limit=12`,
            {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            }
          );

          if (postsRes.ok) {
            const postsData = await postsRes.json();
            setPosts(postsData.data || []);
          }
        } catch (postsErr) {
          console.warn('Erro ao carregar posts:', postsErr);
          // Continua mesmo se posts falhar
        }

        // Check subscription status
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const subRes = await fetch(
              `http://localhost:5000/api/v1/subscriptions/check/${id}`,
              {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
              }
            );

            if (subRes.ok) {
              const subData = await subRes.json();
              setIsSubscribed(subData.data?.isSubscribed || false);
            }
          } catch (subErr) {
            console.warn('Erro ao verificar inscrição:', subErr);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar criador:', err);
        setError('Erro ao carregar dados do perfil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreatorData();
  }, [id]);

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

  const handleSubscribe = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login', { state: { returnTo: `/creator/${id}` } });
      return;
    }
    
    // Preparar dados do pagamento
    setPaymentData({
      creatorId: creator.id,
      type: 'SUBSCRIPTION',
      amountUSD: creator.subscriptionPrice || 30,
    });
    setShowPaymentModal(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 dark:text-slate-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !creator) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 items-center justify-center p-4">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {error || 'Criador não encontrado'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {!id || id === 'undefined' ? 'ID do criador não foi fornecido na URL.' : 'O criador que você procura não existe.'}
          </p>
          <Link to="/" className="inline-block text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            ← Voltar à página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cover Image */}
        <div className="relative h-64 md:h-80 bg-slate-200 dark:bg-slate-900">
          <img
            src={creator.cover || 'https://placehold.co/1200x400/6366F1/white?text=Cover'}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://placehold.co/1200x400/6366F1/white?text=Cover';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

          {/* Back Button */}
          <Link
            to="/"
            className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>

          {/* Share & Report */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <button className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              {/* Avatar */}
              <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 md:-mt-20">
                <div className="relative">
                  <img
                    src={creator.avatar || 'https://placehold.co/200x200/8B7FE8/white?text=' + creator.displayName?.[0]}
                    alt={creator.displayName}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-900 shadow-xl object-cover"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/200x200/8B7FE8/white?text=Creator';
                    }}
                  />
                  {creator.isVerified && (
                    <div className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name & Stats */}
                <div className="flex-1 mt-4 md:mt-0 md:ml-6 md:mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    {creator.displayName}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mb-3">@{creator.username}</p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(creator.subscribers || 0)}</span>
                      <span className="text-slate-500 dark:text-slate-400">assinantes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-slate-900 dark:text-white">{posts.length}</span>
                      <span className="text-slate-500 dark:text-slate-400">posts</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(creator.totalLikes || 0)}</span>
                      <span className="text-slate-500 dark:text-slate-400">curtidas</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 mt-4 md:mt-0 md:mb-4">
                  {isSubscribed ? (
                    <>
                      <button className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Inscrito</span>
                      </button>
                      <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span>Mensagem</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSubscribe}
                        className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        <span>Assinar por {formatPrice(creator.subscriptionPrice || 9.90)}/mês</span>
                      </button>
                      <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bio & Info */}
            <div className="mt-6 space-y-4">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {creator.bio}
              </p>

              {/* Tags */}
              {creator.tags && creator.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {creator.tags.map(tag => (
                    <span key={tag} className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                {creator.location && (
                  <div className="flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{creator.location}</span>
                  </div>
                )}
                {creator.createdAt && (
                  <div className="flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>Membro desde {new Date(creator.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {creator.socialLinks && Object.keys(creator.socialLinks).length > 0 && (
                <div className="flex items-center space-x-3">
                  {creator.socialLinks.instagram && (
                    <a href={creator.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" /></svg>
                    </a>
                  )}
                  {creator.socialLinks.twitter && (
                    <a href={creator.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417a9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                    </a>
                  )}
                  {creator.socialLinks.tiktok && (
                    <a href={creator.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mt-8 -mb-px">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'posts'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span>Posts</span>
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'about'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Sobre</span>
              </button>
            </div>

            {/* Content */}
            <div className="py-8">
              {activeTab === 'posts' && (
                <div>
                  {posts.length === 0 ? (
                    <div className="text-center py-12">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-slate-500 dark:text-slate-400">Nenhum post ainda</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {posts.map(post => (
                        <div key={post.id} className="relative aspect-square group cursor-pointer">
                          <img
                            src={post.thumbnail || post.media?.[0]?.url || 'https://placehold.co/300x300/8B7FE8/white?text=Post'}
                            alt="Post"
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/300x300/8B7FE8/white?text=Post';
                            }}
                          />

                          {/* Locked Overlay */}
                          {post.isLocked && !isSubscribed && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white mx-auto mb-2" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <p className="text-white text-sm font-medium">Assine para ver</p>
                              </div>
                            </div>
                          )}

                          {/* Stats Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-sm">
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                {post.likes || 0}
                              </span>
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                {post.comments || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="max-w-3xl space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Sobre mim</h3>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {creator.bio}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Assinatura</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {formatPrice(creator.subscriptionPrice || 9.90)}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">por mês</p>
                      </div>
                      {!isSubscribed && (
                        <button
                          onClick={handleSubscribe}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
                        >
                          Assinar Agora
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          paymentData={paymentData}
          onSuccess={(payment) => {
            setShowPaymentModal(false);
            setIsSubscribed(true);
            alert('✅ Assinatura ativada com sucesso!');
            // Recarregar página ou atualizar estado
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}