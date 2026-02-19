import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { 
  Rocket, TrendingUp, Users, DollarSign, BarChart3, 
  Plus, ExternalLink, Eye, Settings, Award
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import AnimatedNumber from '../components/AnimatedNumber';
import EmptyState from '../components/EmptyState';
import { formatCompactNumber, formatCurrency, formatPercentage } from '../utils/format';

export default function CreatorDashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - will be replaced with real contract/subgraph data
  const creatorStats = {
    totalTokens: 3,
    totalVolume: '$45,230',
    totalHolders: 1247,
    totalRevenue: '2.45 ETH',
    revenueValue: '$5,432',
    rating: 4.8,
    verifiedBadge: true
  };

  const myTokens = [
    {
      address: '0x1234...5678',
      name: 'Angola Rising',
      symbol: 'AGR',
      holders: 847,
      volume24h: '$12,430',
      price: '0.00105',
      priceChange: '+12.5%',
      isProfit: true,
      marketCap: '$892,340',
      createdAt: '2 weeks ago',
      revenue: '0.85 ETH'
    },
    {
      address: '0x2345...6789',
      name: 'Luanda Tech',
      symbol: 'LTH',
      holders: 234,
      volume24h: '$8,900',
      price: '0.00089',
      priceChange: '-3.2%',
      isProfit: false,
      marketCap: '$234,120',
      createdAt: '1 week ago',
      revenue: '0.34 ETH'
    },
    {
      address: '0x3456...7890',
      name: 'Kizomba Coin',
      symbol: 'KZB',
      holders: 166,
      volume24h: '$23,900',
      price: '0.00124',
      priceChange: '+8.7%',
      isProfit: true,
      marketCap: '$445,980',
      createdAt: '3 days ago',
      revenue: '1.26 ETH'
    }
  ];

  const recentActivity = [
    { type: 'created', token: 'KZB', time: '3 days ago' },
    { type: 'milestone', token: 'AGR', detail: '500 holders reached', time: '5 days ago' },
    { type: 'revenue', token: 'LTH', detail: '0.15 ETH earned', time: '1 week ago' },
    { type: 'created', token: 'LTH', time: '1 week ago' },
  ];

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
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                  <div className="space-y-3">
                    {myTokens.slice(0, 3).map((token) => (
                      <Link
                        key={token.address}
                        to={`/token/${token.address}`}
                        className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-800 hover:scale-[1.01] hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500" />
                          <div>
                            <div className="font-bold text-sm">{token.symbol}</div>
                            <div className="text-xs text-gray-500">{token.holders} holders</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{token.price} ETH</div>
                          <div className={`text-xs ${token.isProfit ? 'text-green-500' : 'text-red-500'}`}>
                            {token.priceChange}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'created' ? 'bg-yellow-500/10 text-yellow-400' :
                          activity.type === 'milestone' ? 'bg-green-500/10 text-green-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {activity.type === 'created' ? <Plus size={16} /> :
                           activity.type === 'milestone' ? <TrendingUp size={16} /> :
                           <DollarSign size={16} />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">
                            {activity.type === 'created' && `Created ${activity.token}`}
                            {activity.type === 'milestone' && `${activity.token}: ${activity.detail}`}
                            {activity.type === 'revenue' && `${activity.token}: ${activity.detail}`}
                          </div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* My Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              {myTokens.length === 0 ? (
                <EmptyState
                  icon={Rocket}
                  title="No Tokens Created Yet"
                  description="Create your first token to start building your creator portfolio"
                  actionLabel="Create Token"
                  actionLink="/launch"
                />
              ) : (
                <>
                  <h2 className="text-2xl font-bold">My Tokens ({myTokens.length})</h2>
                  
                  <div className="grid gap-4">
                    {myTokens.map((token) => (
                      <div key={token.address} className="border border-gray-800 rounded-xl p-4 md:p-6 hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/5 transition-all">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex-shrink-0" />
                            <div>
                              <h3 className="text-xl font-bold">{token.name}</h3>
                              <div className="flex items-center gap-3 text-sm text-gray-400">
                                <span className="font-mono">${token.symbol}</span>
                                <span>•</span>
                                <span>{token.createdAt}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 w-full md:w-auto">
                            <Link
                              to={`/token/${token.address}`}
                              className="flex-1 md:flex-none px-4 py-2 border border-gray-700 hover:border-yellow-400 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all"
                            >
                              <Eye size={16} />
                              View
                            </Link>
                            <button className="flex-1 md:flex-none px-4 py-2 border border-gray-700 hover:border-yellow-400 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all">
                              <Settings size={16} />
                              Manage
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Market Cap</div>
                            <div className="font-bold">{token.marketCap}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Volume 24h</div>
                            <div className="font-bold">{token.volume24h}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Holders</div>
                            <div className="font-bold flex items-center gap-1">
                              <Users size={14} />
                              {token.holders}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Your Revenue</div>
                            <div className="font-bold text-yellow-400">{token.revenue}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <EmptyState
                icon={BarChart3}
                title="Analytics Coming Soon"
                description="Detailed analytics with charts and metrics will be available after subgraph integration."
              />
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
