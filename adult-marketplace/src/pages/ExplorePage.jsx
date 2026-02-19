import { useState } from 'react';
import { Search, TrendingUp, Award, Rocket, Users } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { StaggerContainer, StaggerItem } from '../components/StaggerChildren';
import { formatCompactNumber, formatCurrency, formatPercentage } from '../utils/format';

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('volume');

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 text-white p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden w-full md:w-auto">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl font-black mb-3">Explore Tokens</h1>
            <p className="text-gray-400 text-sm md:text-lg">
              Discover the hottest tokens from the community
            </p>
          </div>

          {/* Search & Filters */}
          <div className="border border-gray-800 hover:border-gray-700 rounded-xl p-4 md:p-6 mb-8 md:mb-12 transition-all">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:outline-none focus:border-yellow-400 hover:border-gray-700 font-semibold transition-colors cursor-pointer"
              >
                <option value="volume">Volume (24h)</option>
                <option value="price">Price</option>
                <option value="holders">Holders</option>
                <option value="recent">Recent</option>
              </select>
            </div>
          </div>

          {/* Tokens Grid */}
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <StaggerItem key={i}>
                <div className="border border-gray-800 hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/10 rounded-xl p-4 md:p-6 transition-all duration-300 hover:scale-[1.02] bg-black/50 backdrop-blur-sm group">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 group-hover:scale-110 transition-transform" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">TOKEN {i}</h3>
                        {i <= 2 && (
                          <Badge variant="warning" size="sm">
                            <TrendingUp size={12} />
                          </Badge>
                        )}
                        {i === 1 && (
                          <Badge variant="primary" size="sm">
                            <Award size={12} />
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Creator {i}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Price</span>
                      <span className="font-bold">{formatCurrency(Math.random() * 5)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Volume 24h</span>
                      <span className="font-semibold text-yellow-400">{formatCurrency(Math.random() * 500000)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Holders</span>
                      <span className="font-semibold flex items-center gap-1">
                        <Users size={14} />
                        {formatCompactNumber(Math.random() * 5000)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={Math.random() > 0.5 ? "success" : "danger"} size="sm">
                        {formatPercentage((Math.random() * 40 - 10), true, 1)} 24h
                      </Badge>
                      {i <= 3 && (
                        <Badge variant="info" size="sm">
                          <Rocket size={12} />
                          New
                        </Badge>
                      )}
                    </div>
                  </div>

                  <button className="w-full bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 text-black py-3 rounded-lg font-bold transition-all shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40">
                    View Token
                  </button>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Empty State */}
          {searchTerm && (
            <EmptyState
              icon={Search}
              title="No tokens found"
              description={`No results for "${searchTerm}". Try a different search term.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
