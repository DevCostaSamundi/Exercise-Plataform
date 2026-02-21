import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Award, Rocket, Users, Loader2, RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { StaggerContainer, StaggerItem } from '../components/StaggerChildren';
import { formatCompactNumber, formatCurrency, formatPercentage } from '../utils/format';
import { useTokenList } from '../hooks/useTokens';
import { useDebounce } from '../hooks/useDebounce';
import { getImageUrl } from '../utils/imageUrl';

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('volume24h');
  const [page, setPage] = useState(1);
  
  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Map sort options to API parameters
  const sortConfig = useMemo(() => ({
    volume24h: { sortBy: 'volume24h', sortOrder: 'desc' },
    price: { sortBy: 'currentPrice', sortOrder: 'desc' },
    holders: { sortBy: 'holdersCount', sortOrder: 'desc' },
    recent: { sortBy: 'createdAt', sortOrder: 'desc' },
    marketCap: { sortBy: 'marketCap', sortOrder: 'desc' }
  }), []);

  // Fetch tokens from API
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useTokenList({
    page,
    limit: 12,
    search: debouncedSearch,
    ...sortConfig[sortBy]
  });

  const tokens = data?.tokens || [];
  const pagination = data?.pagination || { pages: 1 };

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 text-white p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden w-full md:w-auto">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black mb-3">Explore Tokens</h1>
              <p className="text-gray-400 text-sm md:text-lg">
                Discover the hottest tokens from the community
              </p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 border border-gray-800 rounded-lg hover:border-yellow-400 transition-colors"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Search & Filters */}
          <div className="border border-gray-800 hover:border-gray-700 rounded-xl p-4 md:p-6 mb-8 md:mb-12 transition-all">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search tokens by name, symbol, or address..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1); // Reset to first page on search
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-400 hover:border-gray-700 font-semibold transition-colors cursor-pointer"
              >
                <option value="volume24h">Volume (24h)</option>
                <option value="marketCap">Market Cap</option>
                <option value="price">Price</option>
                <option value="holders">Holders</option>
                <option value="recent">Recent</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin w-12 h-12 text-yellow-400" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="border border-red-800 bg-red-950/20 rounded-xl p-6 text-center">
              <p className="text-red-400 mb-4">Failed to load tokens</p>
              <button 
                onClick={() => refetch()}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Tokens Grid */}
          {!isLoading && !error && tokens.length > 0 && (
            <>
              <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {tokens.map((token) => (
                  <StaggerItem key={token.address}>
                    <Link to={`/token/${token.address}`}>
                      <div className="border border-gray-800 hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/10 rounded-xl p-4 md:p-6 transition-all duration-300 hover:scale-[1.02] bg-black/50 backdrop-blur-sm group">
                        <div className="flex items-center gap-4 mb-6">
                          {token.logo ? (
                            <img 
                              src={getImageUrl(token.logo)} 
                              alt={token.name}
                              className="w-16 h-16 rounded-full object-cover group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 group-hover:scale-110 transition-transform flex items-center justify-center text-2xl font-bold text-black">
                              {token.symbol?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{token.name}</h3>
                              {parseFloat(token.priceChange24h || 0) > 10 && (
                                <Badge variant="warning" size="sm">
                                  <TrendingUp size={12} />
                                </Badge>
                              )}
                              {token.isGraduated && (
                                <Badge variant="primary" size="sm">
                                  <Award size={12} />
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              ${token.symbol} • {token.creator?.username || token.creatorAddress?.slice(0, 8) + '...'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Price</span>
                            <span className="font-bold">
                              {formatCurrency(parseFloat(token.currentPrice || 0))}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Volume 24h</span>
                            <span className="font-semibold text-yellow-400">
                              {formatCurrency(parseFloat(token.volume24h || 0))}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Holders</span>
                            <span className="font-semibold flex items-center gap-1">
                              <Users size={14} />
                              {formatCompactNumber(token.holdersCount || token._count?.holders || 0)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Badge 
                              variant={parseFloat(token.priceChange24h || 0) >= 0 ? "success" : "danger"} 
                              size="sm"
                            >
                              {formatPercentage(parseFloat(token.priceChange24h || 0), true, 1)} 24h
                            </Badge>
                            {/* New badge for tokens created in last 24h */}
                            {new Date(token.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) && (
                              <Badge variant="info" size="sm">
                                <Rocket size={12} />
                                New
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-3 rounded-lg font-bold transition-all shadow-lg shadow-yellow-400/20 group-hover:shadow-yellow-400/40 text-center">
                          View Token
                        </div>
                      </div>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-yellow-400 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-400">
                    Page {page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="px-4 py-2 border border-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-yellow-400 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && !error && tokens.length === 0 && (
            <EmptyState
              icon={Search}
              title={searchTerm ? "No tokens found" : "No tokens yet"}
              description={
                searchTerm 
                  ? `No results for "${searchTerm}". Try a different search term.`
                  : "Be the first to create a token!"
              }
              action={
                !searchTerm && (
                  <Link 
                    to="/create"
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold inline-block mt-4"
                  >
                    Create Token
                  </Link>
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
