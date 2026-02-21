import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { 
  Rocket, TrendingUp, Users, DollarSign, BarChart3, 
  Plus, ExternalLink, Eye, Settings, Award, Loader2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import AnimatedNumber from '../components/AnimatedNumber';
import EmptyState from '../components/EmptyState';
import CreatorAnalytics from '../components/CreatorAnalytics';
import RevenueChart from '../components/RevenueChart';
import CreatorStats from '../components/CreatorStats';
import TokenManagementCard from '../components/TokenManagementCard';
import { formatCompactNumber, formatCurrency, formatPercentage } from '../utils/format';
import { getImageUrl } from '../utils/imageUrl';
import { useCreatorProfile } from '../hooks/useCreatorProfile';
import { useTokenFactory } from '../hooks/useTokenFactory';
import { useCreatorTokens, useRecentTrades } from '../hooks/useTokens';

export default function CreatorDashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Web3 hooks
  const { profile, stats, isRegistered, registerCreator, updateProfile, averageRating } = useCreatorProfile(address);
  const { getUserTokens, allTokens } = useTokenFactory();

  // API hooks - real data
  const { data: creatorTokensData, isLoading: tokensLoading } = useCreatorTokens(address);
  const { data: recentTradesData } = useRecentTrades({ limit: 10 });
  
  const myTokens = creatorTokensData?.tokens || creatorTokensData?.data || [];

  // Creator stats from contract
  const creatorStats = {
    totalTokens: myTokens.length || (stats.tokensCreated ? Number(stats.tokensCreated) : 0),
    totalVolume: myTokens.reduce((sum, t) => sum + parseFloat(t.volume24h || t.volume || 0), 0),
    totalHolders: myTokens.reduce((sum, t) => sum + (t.holdersCount || t.holders || 0), 0),
    totalRevenue: '0 ETH',
    revenueValue: '$0',
    rating: averageRating || 0,
    verifiedBadge: profile.isVerified || false,
    isRegistered: isRegistered
  };

  // Build recent activity from real trades
  const recentActivity = (recentTradesData?.trades || [])
    .filter(trade => trade.userAddress?.toLowerCase() === address?.toLowerCase() || 
                     trade.tokenCreator?.toLowerCase() === address?.toLowerCase())
    .slice(0, 5)
    .map(trade => ({
      type: trade.type === 'buy' ? 'buy' : trade.type === 'sell' ? 'sell' : 'trade',
      token: trade.tokenSymbol || trade.symbol || '???',
      detail: `${trade.type} ${parseFloat(trade.amount || 0).toFixed(4)} ETH`,
      time: trade.createdAt ? new Date(trade.createdAt).toLocaleDateString() : 'recently'
    }));

  if (!isConnected) {
    return (
      <div className="flex min-h-screen bg-black">
        <Sidebar />
        <div className="flex-1 text-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <Rocket className="text-yellow-400 mx-auto mb-4" size={64} />
            <h2 className="text-3xl font-bold mb-2">Connect Wallet</h2>
            <p className="text-gray-400">
              Connect your wallet to access your creator dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 text-white p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden w-full md:w-auto">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-2">
                  Creator Dashboard
                  {creatorStats.verifiedBadge && (
                    <Award className="text-yellow-400" size={28} />
                  )}
                </h1>
                <p className="text-gray-400 font-mono text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
              <Link
                to="/launch"
                className="w-full md:w-auto px-6 py-3 bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 text-black rounded-lg font-bold shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Create New Token
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'tokens', label: 'My Tokens' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'profile', label: 'Profile' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-yellow-400 text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Creator Stats */}
              <CreatorStats stats={creatorStats} />

              {/* Revenue Chart */}
              <RevenueChart timeframe="30d" />

              {/* Legacy Stats Grid - Hidden but kept for reference */}
              <div className="hidden grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="border border-gray-800 rounded-xl p-4 md:p-6 hover:border-gray-700 hover:shadow-lg hover:shadow-yellow-400/5 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="text-yellow-400" size={20} />
                    <span className="text-xs md:text-sm text-gray-400">Tokens Created</span>
                  </div>
                  <AnimatedNumber 
                    value={creatorStats.totalTokens} 
                    className="text-2xl md:text-3xl font-bold"
                  />
                </div>

                <div className="border border-gray-800 rounded-xl p-4 md:p-6 hover:border-gray-700 hover:shadow-lg hover:shadow-green-400/5 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="text-green-400" size={20} />
                    <span className="text-xs md:text-sm text-gray-400">Total Volume</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">{creatorStats.totalVolume}</div>
                </div>

                <div className="border border-gray-800 rounded-xl p-4 md:p-6 hover:border-gray-700 hover:shadow-lg hover:shadow-blue-400/5 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-blue-400" size={20} />
                    <span className="text-xs md:text-sm text-gray-400">Total Holders</span>
                  </div>
                  <AnimatedNumber 
                    value={creatorStats.totalHolders} 
                    className="text-2xl md:text-3xl font-bold"
                  />
                </div>

                <div className="border border-gray-800 rounded-xl p-4 md:p-6 hover:border-gray-700 hover:shadow-lg hover:shadow-yellow-400/5 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="text-yellow-400" size={20} />
                    <span className="text-xs md:text-sm text-gray-400">Total Revenue</span>
                  </div>
                  <div className="text-xl md:text-2xl font-bold">{creatorStats.totalRevenue}</div>
                  <div className="text-xs text-gray-500">{creatorStats.revenueValue}</div>
                </div>
              </div>

              {/* Top Tokens & Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Performing Tokens */}
                <div className="border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">Top Performing Tokens</h3>
                  {tokensLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-yellow-400" size={24} />
                    </div>
                  ) : myTokens.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Rocket className="mx-auto mb-2 text-gray-700" size={32} />
                      <p className="text-sm">No tokens created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myTokens.slice(0, 3).map((token) => {
                        const priceChange = parseFloat(token.priceChange24h || token.priceChange || 0);
                        const isProfit = priceChange >= 0;
                        const price = parseFloat(token.currentPrice || token.price || 0);
                        
                        return (
                          <Link
                            key={token.address || token.id}
                            to={`/token/${token.address}`}
                            className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-800 hover:scale-[1.01] hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {token.logo ? (
                                <img 
                                  src={getImageUrl(token.logo)}
                                  alt={token.name}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    const fallback = e.target.parentElement.querySelector('.fallback-icon');
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="fallback-icon w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-bold" style={{display: token.logo ? 'none' : 'flex'}}>
                                {(token.symbol || '?')[0]}
                              </div>
                              <div>
                                <div className="font-bold text-sm">{token.symbol || token.name}</div>
                                <div className="text-xs text-gray-500">{token.holdersCount || token.holders || 0} holders</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                {price < 0.01 ? price.toFixed(6) : price.toFixed(4)} ETH
                              </div>
                              <div className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                {isProfit ? '+' : ''}{priceChange.toFixed(1)}%
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="mx-auto mb-2 text-gray-700" size={32} />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                          <div className={`p-2 rounded-lg ${
                            activity.type === 'buy' ? 'bg-green-500/10 text-green-400' :
                            activity.type === 'sell' ? 'bg-red-500/10 text-red-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {activity.type === 'buy' ? <TrendingUp size={16} /> :
                             activity.type === 'sell' ? <TrendingUp size={16} className="rotate-180" /> :
                             <DollarSign size={16} />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold">
                              {activity.token}: {activity.detail}
                            </div>
                            <div className="text-xs text-gray-500">{activity.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* My Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              {tokensLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-yellow-400" size={32} />
                  <span className="ml-3 text-gray-400">Loading your tokens...</span>
                </div>
              ) : myTokens.length === 0 ? (
                <EmptyState
                  icon={Rocket}
                  title="No Tokens Created Yet"
                  description="Create your first token to start building your creator portfolio"
                  actionLabel="Create Token"
                  actionLink="/launch"
                />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">My Tokens ({myTokens.length})</h2>
                    <Link
                      to="/launch"
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-semibold flex items-center gap-2 transition-all"
                    >
                      <Plus size={18} />
                      <span className="hidden sm:inline">New Token</span>
                    </Link>
                  </div>
                  
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {myTokens.map((token) => (
                      <TokenManagementCard key={token.address} token={token} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Creator Analytics</h2>
              
              {/* Revenue Chart */}
              <RevenueChart timeframe="30d" />
              
              {/* Volume Over Time */}
              <div className="border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Volume Breakdown</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-2">Tokens Created</p>
                    <p className="text-2xl font-bold text-green-400">{myTokens.length}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-2">Total Holders</p>
                    <p className="text-2xl font-bold text-blue-400">{creatorStats.totalHolders}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-2">Total Volume</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      ${creatorStats.totalVolume >= 1000 
                        ? `${(creatorStats.totalVolume / 1000).toFixed(1)}K` 
                        : creatorStats.totalVolume.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <CreatorAnalytics />
            </div>
          )}
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Creator Profile</h2>
              
              <div className="border border-gray-800 rounded-xl p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Display Name</label>
                    <input
                      type="text"
                      placeholder="Your name or brand"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Bio</label>
                    <textarea
                      placeholder="Tell the community about yourself..."
                      rows={4}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none resize-none transition-colors"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Twitter</label>
                      <input
                        type="text"
                        placeholder="@username"
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Telegram</label>
                      <input
                        type="text"
                        placeholder="@username"
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Website</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:border-yellow-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <button className="w-full md:w-auto px-6 py-3 bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 text-black rounded-lg font-bold shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40 transition-all">
                    Save Profile
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="border border-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Creator Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Rating</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {creatorStats.rating} ⭐
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Verified</div>
                    <div className="text-2xl font-bold text-green-400">
                      {creatorStats.verifiedBadge ? '✓' : '✗'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Member Since</div>
                    <div className="text-sm font-bold">Jan 2026</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
