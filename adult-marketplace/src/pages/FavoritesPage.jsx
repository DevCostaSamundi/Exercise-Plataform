import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/user/favorites');
      setFavorites(response.data?.data || []);
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err);
      setError(err.response?.data?.message || 'Erro ao carregar favoritos');
      
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (creatorId) => {
    try {
      await api.delete(`/user/favorites/${creatorId}`);
      setFavorites(favorites.filter(f => f.id !== creatorId));
    } catch (err) {
      console.error('Erro ao remover favorito:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1">
          <LoadingSpinner size="lg" message="Carregando favoritos..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              ❤️ Meus Favoritos
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Criadores que você salvou para acompanhar
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  ⚠️ Dados de demonstração - API não conectada
                </p>
              </div>
            )}

            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((creator) => (
                  <div
                    key={creator.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <Link
                        to={`/creator/${creator.username}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                          {creator.displayName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white truncate">
                            {creator.displayName}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            @{creator.username}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFavorite(creator.id)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        title="Remover dos favoritos"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Assinantes</p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {creator.subscribers.toLocaleString()}
                      </p>
                    </div>

                    {creator.isSubscribed ? (
                      <Link
                        to={`/creator/${creator.username}`}
                        className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 rounded-lg font-medium transition-colors"
                      >
                        Ver Perfil
                      </Link>
                    ) : (
                      <Link
                        to={`/creator/${creator.username}`}
                        className="block w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-center py-2 rounded-lg font-medium transition-colors"
                      >
                        Assinar Agora
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg
                  className="mx-auto h-24 w-24 text-slate-400 dark:text-slate-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Nenhum favorito ainda
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400 mb-6">
                  Adicione criadores aos favoritos para acompanhá-los mais facilmente
                </p>
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Explorar Criadores
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
