/**
 * Página de Favoritos
 * Criadores favoritados pelo usuário
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, SORT_OPTIONS } from '../../config/constants';
import CreatorCard from '../../components/subscriber/CreatorCard';
import { FiHeart, FiInbox } from 'react-icons/fi';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.RECENT);

  useEffect(() => {
    fetchFavorites();
  }, [sortBy]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pride_connect_token');
      const response = await axios.get(`${API_BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { sort: sortBy },
      });

      setFavorites(response.data.favorites);
    } catch (err) {
      console.error('Erro ao buscar favoritos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (creatorId) => {
    try {
      const token = localStorage.getItem('pride_connect_token');
      await axios.delete(`${API_BASE_URL}/favorites/${creatorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove from list
      setFavorites((prev) => prev.filter((fav) => fav._id !== creatorId));
    } catch (err) {
      console.error('Erro ao desfavoritar:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiHeart className="text-3xl text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Favoritos
          </h1>
        </div>

        {/* Sort Options */}
        {favorites.length > 0 && (
          <div className="flex gap-2">
            {[
              { value: SORT_OPTIONS.RECENT, label: 'Recentes' },
              { value: SORT_OPTIONS.ALPHABETICAL, label: 'A-Z' },
              { value: 'most_active', label: 'Mais Ativos' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  sortBy === option.value
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ?  (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <FiHeart className="text-5xl text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum favorito ainda
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Favorite criadores para acompanhar mais facilmente! 
          </p>
          <a
            href="/explore"
            className="inline-block px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
          >
            Explorar Criadores
          </a>
        </div>
      ) : (
        /* Favorites Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((creator) => (
            <div key={creator._id} className="relative group">
              <CreatorCard creator={creator} />
              
              {/* Unfavorite Button (on hover) */}
              <button
                onClick={() => handleUnfavorite(creator._id)}
                className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover dos favoritos"
              >
                <FiHeart className="text-red-500 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;