import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Flame, Rocket, Star, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MobileBottomNav from '../components/MobileBottomNav';
import { useTrendingTokens, useRecentTokens, useTokenList } from '../hooks/useTokens';
import { formatCompactNumber, formatCurrency, formatPercentage } from '../utils/format';
import { getImageUrl } from '../utils/imageUrl';

export default function TrendingPage() {
  const [filter, setFilter] = useState('24h');

  // Fetch data based on active filter - only fetch what's needed
  const { data: trendingData, isLoading: trendingLoading } = useTrendingTokens(20, { enabled: filter === '24h' || filter === '7d' });
  const { data: recentData, isLoading: recentLoading } = useRecentTokens(20, { enabled: filter === 'new' });
  const { data: allTimeData, isLoading: allTimeLoading } = useTokenList({ 
    limit: 20, 
    sortBy: 'totalVolume', 
    sortOrder: 'desc'
  }, { enabled: filter === 'top' });

  const filters = [
    { id: '24h', label: '24 Hours', icon: Flame },
    { id: '7d', label: '7 Days', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Rocket },
    { id: 'top', label: 'All Time', icon: Star },
  ];

  // Select tokens based on filter
  const getTokens = () => {
    switch (filter) {
      case '24h':
      case '7d':
        return trendingData?.tokens || [];
      case 'new':
        return recentData?.tokens || [];
      case 'top':
        return allTimeData?.tokens || allTimeData?.data || [];
      default:
        return [];
    }
  };

  const isLoading = filter === 'new' ? recentLoading : filter === 'top' ? allTimeLoading : trendingLoading;
  const tokens = getTokens();

  const formatPrice = (price) => {
    if (!price) return '$0.00';
    const num = parseFloat(price);
    if (num < 0.01) return `$${num.toFixed(6)}`;
    if (num < 1) return `$${num.toFixed(4)}`;
    return `$${num.toFixed(2)}`;
  };

  const formatVolume = (volume) => {
    if (!volume) return '$0';
    const num = parseFloat(volume);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 text-white p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden w-full md:w-auto">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-6 md:mb-12">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <Flame className="text-yellow-400 w-6 h-6 md:w-8 md:h-8" />
              <h1 className="text-2xl md:text-5xl font-black">Trending</h1>
            </div>
            <p className="text-gray-400 text-xs md:text-lg">
              Most traded and popular tokens on the platform
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 md:gap-3 mb-6 md:mb-12 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap text-sm md:text-base ${
                  filter === id
                    ? 'bg-yellow-400 text-black'
                    : 'border border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{id === '24h' ? '24h' : id === '7d' ? '7d' : id === 'new' ? 'New' : 'Top'}</span>
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-yellow-400" size={32} />
              <span className="ml-3 text-gray-400">Loading tokens...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && tokens.length === 0 && (
            <div className="text-center py-20">
              <Flame className="text-gray-700 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No tokens yet</h3>
              <p className="text-gray-600">Be the first to create a token!</p>
              <Link to="/launch" className="inline-block mt-4 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-bold transition-all">
                Create Token
              </Link>
            </div>
          )}

          {/* Trending List */}
          {!isLoading && tokens.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              {tokens.map((token, index) => {
                const rank = index + 1;
                const priceChange = parseFloat(token.priceChange24h || token.priceChange || 0);
                const isPositive = priceChange >= 0;

                return (
                  <div
                    key={token.address || token.id || index}
                    className="border border-gray-800 hover:border-gray-700 rounded-xl p-4 md:p-6 transition-all"
                  >
                    <div className="flex items-center gap-3 md:gap-6">
                      {/* Rank */}
                      <div className={`text-xl md:text-3xl font-bold min-w-[40px] md:min-w-[60px] text-center ${
                        rank === 1 ? 'text-yellow-400' :
                        rank === 2 ? 'text-gray-400' :
                        rank === 3 ? 'text-orange-500' :
                        'text-gray-600'
                      }`}>
                        #{rank}
                      </div>

                      {/* Token Icon */}
                      {token.logo ? (
                        <img 
                          src={getImageUrl(token.logo)}
                          alt={token.name}
                          className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement.querySelector('.fallback-icon');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="fallback-icon w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex-shrink-0 flex items-center justify-center text-black font-bold text-lg" style={{display: token.logo ? 'none' : 'flex'}}>
                        {(token.symbol || '?')[0]}
                      </div>

                      {/* Token Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-sm md:text-lg truncate">
                            {token.name || token.symbol || 'Unknown'}
                          </h3>
                          <span className="text-xs text-gray-500">{token.symbol}</span>
                          {rank <= 3 && (
                            <span className="px-2 py-0.5 md:py-1 bg-yellow-400/10 text-yellow-400 rounded text-[10px] md:text-xs font-bold flex-shrink-0">
                              HOT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] md:text-sm text-gray-500 truncate">
                          by {token.creatorAddress ? `${token.creatorAddress.slice(0, 6)}...${token.creatorAddress.slice(-4)}` : 'Unknown'}
                        </p>
                        
                        {/* Mobile Stats - Inline */}
                        <div className="flex md:hidden gap-4 mt-2 text-[11px]">
                          <div>
                            <span className="text-gray-500">$</span>
                            <span className="font-bold ml-1">{formatPrice(token.currentPrice || token.price).replace('$', '')}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Vol</span>
                            <span className="font-bold text-yellow-400 ml-1">{formatVolume(token.volume24h || token.volume)}</span>
                          </div>
                          <div className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Desktop Stats */}
                      <div className="hidden md:grid grid-cols-3 gap-8 lg:gap-12 text-center">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Price</p>
                          <p className="font-bold text-sm">{formatPrice(token.currentPrice || token.price)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Volume 24h</p>
                          <p className="font-bold text-yellow-400 text-sm">{formatVolume(token.volume24h || token.volume)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">24h</p>
                          <p className={`font-bold text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link
                        to={`/token/${token.address}`}
                        className="px-3 md:px-6 py-1.5 md:py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-bold transition-all text-xs md:text-base flex-shrink-0"
                      >
                        <span className="hidden sm:inline">View</span>
                        <span className="sm:hidden">→</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
