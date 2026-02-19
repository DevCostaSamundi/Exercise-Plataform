import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TokenChart from '../components/TokenChart';
import { TrendingUp, DollarSign, Users, Rocket, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('24h');

  // Mock data (will come from contracts/subgraph)
  const analytics = {
    totalVolume: {
      '24h': '$1,254,300',
      '7d': '$8,432,100',
      '30d': '$32,145,600',
    },
    tvl: '$12,543,200',
    totalTokens: 247,
    totalHolders: 8934,
    change24h: '+12.5%',
  };

  const topGainers = [
    { rank: 1, name: 'Angola Rising', symbol: 'AGR', change: '+45.2%', volume: '$125,430', price: '$0.0012' },
    { rank: 2, name: 'Base Builders', symbol: 'BUILD', change: '+38.7%', volume: '$98,200', price: '$0.0089' },
    { rank: 3, name: 'Crypto Africa', symbol: 'CAF', change: '+32.1%', volume: '$87,500', price: '$0.0045' },
    { rank: 4, name: 'Moon Token', symbol: 'MOON', change: '+28.9%', volume: '$76,300', price: '$0.0023' },
    { rank: 5, name: 'Diamond Hands', symbol: 'DIAM', change: '+25.4%', volume: '$65,100', price: '$0.0067' },
  ];

  const topLosers = [
    { rank: 1, name: 'Rug Pull', symbol: 'RUG', change: '-28.4%', volume: '$12,400', price: '$0.0001' },
    { rank: 2, name: 'Paper Hands', symbol: 'PAPER', change: '-22.1%', volume: '$18,200', price: '$0.0003' },
    { rank: 3, name: 'Slow Coin', symbol: 'SLOW', change: '-18.7%', volume: '$24,500', price: '$0.0008' },
  ];

  const recentLaunches = [
    { name: 'New Token 1', symbol: 'NEW1', age: '2h', holders: 45, volume: '$12,300' },
    { name: 'New Token 2', symbol: 'NEW2', age: '5h', holders: 89, volume: '$23,400' },
    { name: 'New Token 3', symbol: 'NEW3', age: '8h', holders: 156, volume: '$45,600' },
  ];

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 text-white p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden w-full md:w-auto">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Market insights and performance metrics</p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-3 mb-8">
            {['24h', '7d', '30d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-yellow-400 text-black'
                    : 'border border-gray-800 hover:border-gray-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="border border-gray-800 rounded-xl p-6 bg-gradient-to-br from-yellow-950/20 to-black">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-yellow-400" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Volume</p>
                  <p className="text-2xl font-bold">{analytics.totalVolume[timeframe]}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-500 text-sm">
                <ArrowUpRight size={16} />
                <span>{analytics.change24h}</span>
              </div>
            </div>

            <div className="border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center">
                  <Activity className="text-blue-400" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Value Locked</p>
                  <p className="text-2xl font-bold">{analytics.tvl}</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-400/20 rounded-lg flex items-center justify-center">
                  <Rocket className="text-purple-400" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Tokens</p>
                  <p className="text-2xl font-bold">{analytics.totalTokens}</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center">
                  <Users className="text-green-400" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Holders</p>
                  <p className="text-2xl font-bold">{analytics.totalHolders.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Volume Overview</h2>
            <TokenChart tokenAddress="0x0000000000000000000000000000000000000000" />
          </div>

          {/* Leaderboards */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Top Gainers */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-green-500" size={24} />
                <h2 className="text-2xl font-bold">Top Gainers ({timeframe})</h2>
              </div>
              <div className="border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">#</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">Token</th>
                      <th className="text-right p-4 text-sm font-semibold text-gray-400">Change</th>
                      <th className="text-right p-4 text-sm font-semibold text-gray-400">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topGainers.map((token) => (
                      <tr key={token.rank} className="border-t border-gray-800 hover:bg-gray-900/50">
                        <td className="p-4 text-gray-400">{token.rank}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold">{token.name}</p>
                            <p className="text-sm text-gray-400">${token.symbol}</p>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-green-500 font-bold">{token.change}</span>
                        </td>
                        <td className="p-4 text-right text-gray-300">{token.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Losers */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <ArrowDownRight className="text-red-500" size={24} />
                <h2 className="text-2xl font-bold">Top Losers ({timeframe})</h2>
              </div>
              <div className="border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">#</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-400">Token</th>
                      <th className="text-right p-4 text-sm font-semibold text-gray-400">Change</th>
                      <th className="text-right p-4 text-sm font-semibold text-gray-400">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLosers.map((token) => (
                      <tr key={token.rank} className="border-t border-gray-800 hover:bg-gray-900/50">
                        <td className="p-4 text-gray-400">{token.rank}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold">{token.name}</p>
                            <p className="text-sm text-gray-400">${token.symbol}</p>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-red-500 font-bold">{token.change}</span>
                        </td>
                        <td className="p-4 text-right text-gray-300">{token.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Launches */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="text-yellow-400" size={24} />
              <h2 className="text-2xl font-bold">Recent Launches</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {recentLaunches.map((token, idx) => (
                <div key={idx} className="border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{token.name}</h3>
                      <p className="text-gray-400">${token.symbol}</p>
                    </div>
                    <span className="text-xs bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full">
                      {token.age} ago
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Holders</span>
                      <span className="font-semibold">{token.holders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Volume</span>
                      <span className="font-semibold">{token.volume}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
