import { Link } from 'react-router-dom';

export default function RightSidebar() {
  // Mock data
  const trendingCreators = [
    { id: 1, name: 'Luna', avatar: 'https://placehold.co/50x50/8B7FE8/white?text=L', subscribers: '1.2k', isVerified: true },
    { id: 2, name: 'Kai', avatar: 'https://placehold.co/50x50/6366F1/white?text=K', subscribers: '2.9k', isVerified: true },
    { id: 4, name: 'Aria', avatar: 'https://placehold.co/50x50/EC4899/white?text=A', subscribers: '3.5k', isVerified: true },
  ];

  const trendingTags = [
    { tag: 'Trans', count: '2.4k', emoji: '🏳️‍⚧️' },
    { tag: 'Fitness', count: '1.8k', emoji: '💪' },
    { tag: 'Drag', count: '1.5k', emoji: '✨' },
    { tag: 'BDSM', count: '1.2k', emoji: '🔗' },
    { tag: 'Natural', count: '980', emoji: '🌿' },
  ];

  const suggestions = [
    { title: 'Complete seu perfil', description: 'Adicione uma bio e foto de perfil', icon: '👤', color: 'indigo' },
    { title: 'Explore criadores LGBT+', description: 'Descubra conteúdo autêntico', icon: '🏳️‍🌈', color: 'purple' },
  ];

  return (
    <aside className="hidden xl:block w-80 h-screen sticky top-0 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Trending Creators */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <span className="text-lg mr-2">🔥</span>
          Em Alta
        </h3>
        <div className="space-y-3">
          {trendingCreators.map((creator) => (
            <Link
              key={creator.id}
              to={`/creator/${creator.id}`}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
            >
              <div className="relative">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-10 h-10 rounded-full"
                />
                {creator.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {creator.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{creator.subscribers} assinantes</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          ))}
        </div>
        <Link
          to="/trending"
          className="block mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-center"
        >
          Ver todos →
        </Link>
      </div>

      {/* Trending Tags */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <span className="text-lg mr-2">🏷️</span>
          Tags Populares
        </h3>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((item) => (
            <Link
              key={item.tag}
              to={`/explore?tag=${item.tag.toLowerCase()}`}
              className="inline-flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <span>{item.emoji}</span>
              <span>{item.tag}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{item.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <span className="text-lg mr-2">💡</span>
          Sugestões
        </h3>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer group"
            >
              <div className={`w-10 h-10 bg-${suggestion.color}-100 dark:bg-${suggestion.color}-900/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <span className="text-lg">{suggestion.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{suggestion.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{suggestion.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Info */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
        <h3 className="font-bold mb-2 flex items-center">
          <span className="text-lg mr-2">🎉</span>
          Seja um Criador!
        </h3>
        <p className="text-sm text-white/90 mb-4">
          Monetize seu conteúdo e construa sua comunidade LGBT+
        </p>
        <Link
          to="/creator-register"
          className="block w-full bg-white hover:bg-slate-100 text-indigo-600 text-center font-bold py-2 px-4 rounded-lg text-sm transition-colors"
        >
          Comece Agora 💰
        </Link>
      </div>

      {/* Footer Links */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 px-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link to="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400">Sobre</Link>
          <Link to="/help" className="hover:text-indigo-600 dark:hover:text-indigo-400">Ajuda</Link>
          <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400">Termos</Link>
          <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacidade</Link>
          <Link to="/safety" className="hover:text-indigo-600 dark:hover:text-indigo-400">Segurança</Link>
        </div>
        <p className="text-slate-400 dark:text-slate-500">
          © 2025 PrideConnect. Feito com 💜
        </p>
      </div>
    </aside>
  );
}