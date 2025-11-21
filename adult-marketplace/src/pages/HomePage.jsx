// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Mock de criadores (em produção, viria de uma API)
const mockCreators = [
  {
    id: 1,
    username: 'luna.oficial',
    displayName: 'Luna',
    category: 'Fotos',
    price: 24.9,
    currency: 'BRL',
    avatar: 'https://placehold.co/100x100/4f46e5/white?text=L',
    isVerified: true,
    hasStory: true,
    tags: ['trans', 'sensual', 'artístico'],
    isLive: false,
    lastPost: 'https://placehold.co/200x200/4f46e5/white?text=Post+L',
  },
  {
    id: 2,
    username: 'kai.vibes',
    displayName: 'Kai',
    category: 'Vídeos',
    price: 34.9,
    currency: 'BRL',
    avatar: 'https://placehold.co/100x100/ec4899/white?text=K',
    isVerified: true,
    hasStory: false,
    tags: ['gay', 'fitness', 'teaser'],
    isLive: true,
    lastPost: 'https://placehold.co/200x200/ec4899/white?text=Post+K',
  },
  {
    id: 3,
    username: 'zayn.chat',
    displayName: 'Zayn',
    category: 'Chat',
    price: 19.9,
    currency: 'BRL',
    avatar: 'https://placehold.co/100x100/0ea5e9/white?text=Z',
    isVerified: false,
    hasStory: true,
    tags: ['nonbinary', 'flirty', 'voice'],
    isLive: false,
    lastPost: 'https://placehold.co/200x200/0ea5e9/white?text=Post+Z',
  },
  {
    id: 4,
    username: 'aria.live',
    displayName: 'Aria',
    category: 'Lives',
    price: 29.9,
    currency: 'BRL',
    avatar: 'https://placehold.co/100x100/f97316/white?text=A',
    isVerified: true,
    hasStory: true,
    tags: ['drag', 'show', 'interactive'],
    isLive: true,
    lastPost: 'https://placehold.co/200x200/f97316/white?text=Post+A',
  },
  {
    id: 5,
    username: 'maya.secret',
    displayName: 'Maya',
    category: 'Fotos + Vídeos',
    price: 39.9,
    currency: 'BRL',
    avatar: 'https://placehold.co/100x100/8b5cf6/white?text=M',
    isVerified: true,
    hasStory: false,
    tags: ['lesbian', 'boudoir', 'exclusive'],
    isLive: false,
    lastPost: 'https://placehold.co/200x200/8b5cf6/white?text=Post+M',
  },
];

// Mock de posts recentes (para simular feed)
const mockRecentPosts = [
  { id: 1, creatorId: 1, image: 'https://placehold.co/300x300/4f46e5/white?text=Post1', likes: 120, comments: 15 },
  { id: 2, creatorId: 2, image: 'https://placehold.co/300x300/ec4899/white?text=Post2', likes: 85, comments: 8 },
  { id: 3, creatorId: 4, image: 'https://placehold.co/300x300/f97316/white?text=Post3', likes: 200, comments: 25 },
];

// Função para formatar moeda com base na localização (simplificada)
const formatPrice = (price, currency = 'BRL') => {
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(price);
};

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [creators, setCreators] = useState(mockCreators);
  const [activeTab, setActiveTab] = useState('creators'); // Para alternar entre abas: creators, feed, lives

  // Filtragem dinâmica
  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.displayName.toLowerCase().includes(search.toLowerCase()) ||
                          creator.username.toLowerCase().includes(search.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
                        selectedTags.some(tag => creator.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  // Tags únicas para filtro
  const allTags = [...new Set(mockCreators.flatMap(c => c.tags))].slice(0, 6);

  // Simular modo discreto (em produção, viria de settings do usuário)
  const [discreetMode, setDiscreetMode] = useState(() => {
    return localStorage.getItem('discreetMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('discreetMode', discreetMode);
  }, [discreetMode]);

  // Criadores ao vivo
  const liveCreators = creators.filter(c => c.isLive);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header estilo OnlyFans com mais elementos */}
      <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">
              {discreetMode ? 'Conexões' : 'Conexões Privadas'}
            </h1>
            {/* Ícone de notificações */}
            <button className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9a7 7 0 10-14 0v3l-5 5h5v5a2 2 0 002 2h6a2 2 0 002-2v-5z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {/* Link para perfil do usuário */}
            <Link to="/profile" className="text-sm bg-gray-800 px-3 py-1 rounded-full hover:bg-gray-700 transition">
              Perfil
            </Link>
            <button
              onClick={() => setDiscreetMode(!discreetMode)}
              className="text-xs bg-gray-800 px-2 py-1 rounded-full hover:bg-gray-700 transition"
            >
              {discreetMode ? 'Modo Normal' : 'Modo Discreto'}
            </button>
          </div>
        </div>

        {/* Barra de busca */}
        <div className="mb-3">
          <input
            type="text"
            placeholder={discreetMode ? 'Buscar...' : 'Buscar criadores...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Filtros por tags (temas LGBT+, interesses) */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTags(prev =>
                  prev.includes(tag)
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                );
              }}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                selectedTags.includes(tag)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Abas para navegação (Criadores, Feed, Lives) */}
        <div className="flex justify-around mt-3 border-t border-gray-800 pt-3">
          <button
            onClick={() => setActiveTab('creators')}
            className={`text-sm ${activeTab === 'creators' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
          >
            Criadores
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`text-sm ${activeTab === 'feed' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('lives')}
            className={`text-sm ${activeTab === 'lives' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
          >
            Lives ({liveCreators.length})
          </button>
        </div>
      </header>

      {/* Stories (miniaturas circulares no topo) */}
      <div className="px-4 pb-4">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2">
          {mockCreators
            .filter(c => c.hasStory)
            .map(creator => (
              <div key={`story-${creator.id}`} className="flex flex-col items-center space-y-1">
                <div className="relative">
                  <img
                    src={creator.avatar}
                    alt={creator.displayName}
                    className="w-14 h-14 rounded-full border-2 border-purple-500 object-cover"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 -z-10"></div>
                  {creator.isLive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                  )}
                </div>
                <span className="text-xs max-w-[60px] truncate text-center">
                  {creator.displayName}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Conteúdo principal baseado na aba ativa */}
      <main className="p-4 pt-0">
        {activeTab === 'creators' && (
          <>
            {/* Grade de criadores */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredCreators.map((creator) => (
                <Link
                  key={creator.id}
                  to={`/creator/${creator.id}`}
                  className="bg-gray-800 rounded-xl overflow-hidden shadow hover:bg-gray-750 transition group"
                >
                  {/* Avatar com efeito hover */}
                  <div className="relative">
                    <img
                      src={creator.avatar}
                      alt={creator.displayName}
                      className="w-full aspect-square object-cover"
                    />
                    {creator.hasStory && (
                      <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    )}
                    {creator.isVerified && (
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {creator.isLive && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">AO VIVO</div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{creator.displayName}</h3>
                    <p className="text-xs text-gray-400 truncate">{creator.category}</p>
                    <p className="text-sm text-purple-400 font-medium mt-1">
                      {formatPrice(creator.price, creator.currency)}/mês
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {filteredCreators.length === 0 && (
              <p className="text-center text-gray-500 mt-8">Nenhum criador encontrado.</p>
            )}
          </>
        )}

        {activeTab === 'feed' && (
          <>
            {/* Feed de posts recentes */}
            <div className="space-y-4">
              {mockRecentPosts.map(post => (
                <div key={post.id} className="bg-gray-800 rounded-xl overflow-hidden">
                  <img src={post.image} alt="Post" className="w-full" />
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">❤️ {post.likes} 💬 {post.comments}</span>
                      <button className="text-purple-400 text-sm">Ver mais</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'lives' && (
          <>
            {/* Lives ao vivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {liveCreators.map(creator => (
                <div key={creator.id} className="bg-gray-800 rounded-xl overflow-hidden">
                  <div className="relative">
                    <img src={creator.lastPost} alt="Live" className="w-full aspect-video object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <button className="bg-red-500 text-white px-4 py-2 rounded-full">Entrar na Live</button>
                    </div>
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">AO VIVO</div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold">{creator.displayName}</h3>
                    <p className="text-xs text-gray-400">{creator.category}</p>
                  </div>
                </div>
              ))}
            </div>
            {liveCreators.length === 0 && (
              <p className="text-center text-gray-500 mt-8">Nenhuma live ao vivo no momento.</p>
            )}
          </>
        )}

        {/* Rodapé com política de privacidade discreta e ênfase em segurança */}
        <div className="text-center text-gray-600 text-xs mt-12 mb-20">
          {discreetMode
            ? 'Serviços digitais seguros e confidenciais. Criptografia end-to-end para todas as interações.'
            : 'Pagamentos 100% discretos. Nenhum detalhe sensível aparece no extrato bancário. Protegemos sua privacidade com criptografia avançada.'}
        </div>
      </main>
    </div>
  );
}