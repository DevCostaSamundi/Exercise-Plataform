import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Flame, Rocket, Star, Award } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Badge from '../components/Badge';
import { StaggerContainer, StaggerItem } from '../components/StaggerChildren';
import { formatCompactNumber, formatCurrency, formatPercentage } from '../utils/format';

export default function TrendingPage() {
  const [filter, setFilter] = useState('24h');

  const filters = [
    { id: '24h', label: '24 Hours', icon: Flame },
    { id: '7d', label: '7 Days', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Rocket },
    { id: 'top', label: 'All Time', icon: Star },
  ];

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

          {/* Trending List */}
          <StaggerContainer className="space-y-3 md:space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <StaggerItem key={i}>
                <div className="border border-gray-800 hover:border-yellow-400/20 hover:shadow-lg hover:shadow-yellow-400/10 rounded-xl p-4 md:p-6 transition-all duration-300 hover:scale-[1.01] bg-black/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 md:gap-6">
                    {/* Rank */}
                    <div className={`text-xl md:text-3xl font-bold min-w-[40px] md:min-w-[60px] text-center ${
                      i === 1 ? 'text-yellow-400' :
                      i === 2 ? 'text-gray-400' :
                      i === 3 ? 'text-orange-500' :
                      'text-gray-600'
                    }`}>
                      #{i}
                    </div>

                    {/* Token Icon */}
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex-shrink-0" />

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-sm md:text-lg truncate">TOKEN {i}</h3>
                        {i <= 3 && (
                          <Badge variant="warning" size="sm">
                            <Flame size={12} />
                            HOT
                          </Badge>
                        )}
                        {i === 1 && (
                          <Badge variant="primary" size="sm">
                            <Award size={12} />
                            #1
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] md:text-sm text-gray-500 truncate">by Creator {i}</p>
                      
                      {/* Mobile Stats - Inline */}
                      <div className="flex md:hidden gap-4 mt-2 text-[11px]">
                        <div>
                          <span className="text-gray-500">$</span>
                          <span className="font-bold ml-1">{formatCompactNumber(Math.random() * 10, 2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Vol</span>
                          <span className="font-bold text-yellow-400 ml-1">{formatCompactNumber(Math.random() * 1000000)}</span>
                        </div>
                        <div className={`font-bold ${Math.random() > 0.5 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercentage((Math.random() * 40 - 10), true, 1)}
                        </div>
                      </div>
                    </div>

                    {/* Desktop Stats */}
                    <div className="hidden md:grid grid-cols-3 gap-8 lg:gap-12 text-center">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Price</p>
                        <p className="font-bold text-sm">{formatCurrency(Math.random() * 10)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Volume 24h</p>
                        <p className="font-bold text-yellow-400 text-sm">{formatCurrency(Math.random() * 1000000)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">24h</p>
                        <p className={`font-bold text-sm ${Math.random() > 0.5 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercentage((Math.random() * 40 - 10), true, 1)}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/token/${i}`}
                      className="px-3 md:px-6 py-1.5 md:py-2.5 bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 text-black rounded-lg font-bold transition-all text-xs md:text-base flex-shrink-0 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40"
                    >
                      <span className="hidden sm:inline">View</span>
                      <span className="sm:hidden">→</span>
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </div>
  );
}

