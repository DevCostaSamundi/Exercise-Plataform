/**
 * Barra de Busca
 * Com autocomplete e sugestões
 */

import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

const SearchBar = ({ placeholder = 'Buscar criadores...', autoFocus = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      searchCreators(debouncedQuery);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [debouncedQuery]);

  const searchCreators = async (searchQuery) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pride_connect_token');
      const response = await axios.get(`${API_BASE_URL}/creators/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: searchQuery, limit: 5 },
      });

      setResults(response.data. creators || []);
      setShowResults(true);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (creator) => {
    navigate(`/creator/${creator.username}`);
    setQuery('');
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-11 pr-11 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Buscando...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {results.map((creator) => (
                <button
                  key={creator._id}
                  onClick={() => handleResultClick(creator)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <img
                    src={creator.avatar || '/default-avatar.png'}
                    alt={creator.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {creator.name}
                      {creator.isVerified && (
                        <span className="ml-1 text-blue-500">✓</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{creator.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Nenhum criador encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;