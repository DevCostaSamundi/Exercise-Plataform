import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Wallet, Coins, TrendingUp, DollarSign, ExternalLink, RefreshCw, Inbox, Rocket } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import EmptyState from '../components/EmptyState';
import FadeIn from '../components/FadeIn';
import AnimatedNumber from '../components/AnimatedNumber';
import { formatEth, formatCurrency } from '../utils/format';

export default function MyPortfolioPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('holdings');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock portfolio data (will come from contracts/subgraph)
  const portfolio = {
    totalValue: '$1,254.30',
    totalValueChange: '+8.5%',
    totalYieldEarned: '0.245 ETH',
    totalYieldValue: '$543.21'
  };

  // Para demonstrar empty state, use array vazio: const [holdings] = useState([]);
  const [holdings] = useState([
    {
      tokenAddress: '0x1234...5678',
      name: 'Angola Rising',
      symbol: 'AGR',
      balance: '15,420',
      value: '$154.20',
      valueChange: '+12.5%',
      avgBuyPrice: '0.0095',
      currentPrice: '0.0107',
      profitLoss: '+$18.48',
      profitLossPercent: '+12.6%',
      isProfit: true
    },
    {
      tokenAddress: '0x2345...6789',
      name: 'Luanda Tech',
      symbol: 'LTH',
      balance: '8,900',
      value: '$267.00',
      valueChange: '-3.2%',
      avgBuyPrice: '0.0315',
      currentPrice: '0.0300',
      profitLoss: '-$13.35',
      profitLossPercent: '-4.8%',
      isProfit: false
    }
  ]);

  const [yieldHistory] = useState([
    {
      id: 1,
      token: 'AGR',
      tokenName: 'Angola Rising',
      amount: '0.0245 ETH',
      value: '$54.32',
      timestamp: '2 hours ago',
      status: 'claimed'
    },
    {
      id: 2,
      token: 'LTH',
      tokenName: 'Luanda Tech',
      amount: '0.0189 ETH',
      value: '$41.89',
      timestamp: '1 day ago',
      status: 'claimed'
    },
    {
      id: 3,
      token: 'AGR',
      tokenName: 'Angola Rising',
      amount: '0.0312 ETH',
      value: '$69.12',
      timestamp: '3 days ago',
      status: 'claimed'
    }
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Refresh data from contracts
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!isConnected) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <Wallet className="text-yellow-400 mx-auto mb-4" size={64} />
            <h2 className="text-3xl font-bold mb-2">Connect Wallet</h2>
            <p className="text-gray-400">
              Please connect your wallet to view your portfolio
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-3xl md:text-5xl font-black mb-2">My Portfolio</h1>
              <p className="text-gray-400 font-mono text-sm md:text-base">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 border border-gray-800 hover:border-gray-700 rounded-lg flex items-center gap-2 text-sm md:text-base"
            >
              <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={18} />
              Refresh
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            <div className="border border-gray-800 rounded-xl p-3 md:p-6">
              <div className="flex items-center gap-1 md:gap-2 mb-2 text-gray-400 text-xs md:text-sm">
                <Wallet size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">Total Value</span>
                <span className="sm:hidden">Value</span>
              </div>
              <div className="text-xl md:text-3xl font-bold mb-1">{portfolio.totalValue}</div>
              <div className={`text-xs md:text-sm ${parseFloat(portfolio.totalValueChange) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolio.totalValueChange}
              </div>
            </div>

            <div className="border border-gray-800 rounded-xl p-3 md:p-6">
              <div className="flex items-center gap-1 md:gap-2 mb-2 text-gray-400 text-xs md:text-sm">
                <Coins size={14} className="md:w-4 md:h-4" />
                Holdings
              </div>
              <div className="text-xl md:text-3xl font-bold mb-1">{holdings.length}</div>
              <div className="text-xs md:text-sm text-gray-500">Tokens</div>
            </div>

            <div className="border border-yellow-800 bg-yellow-950/20 rounded-xl p-3 md:p-6">
              <div className="flex items-center gap-1 md:gap-2 mb-2 text-yellow-400 text-xs md:text-sm">
                <TrendingUp size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">Yield Earned</span>
                <span className="sm:hidden">Yield</span>
              </div>
              <div className="text-xl md:text-3xl font-bold text-yellow-400 mb-1">{portfolio.totalYieldEarned}</div>
              <div className="text-xs md:text-sm text-gray-400">{portfolio.totalYieldValue}</div>
            </div>

            <div className="border border-gray-800 rounded-xl p-3 md:p-6">
              <div className="flex items-center gap-1 md:gap-2 mb-2 text-gray-400 text-xs md:text-sm">
                <DollarSign size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">Total P&L</span>
                <span className="sm:hidden">P&L</span>
              </div>
              <div className="text-xl md:text-3xl font-bold text-green-500 mb-1">+$156.89</div>
              <div className="text-xs md:text-sm text-green-500">+8.5%</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 md:gap-3 mb-6 border-b border-gray-900 overflow-x-auto">
            <button
              onClick={() => setActiveTab('holdings')}
              className={`px-4 md:px-6 py-3 font-bold text-sm md:text-base whitespace-nowrap ${
                activeTab === 'holdings'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Holdings ({holdings.length})
            </button>
            <button
              onClick={() => setActiveTab('yield')}
              className={`px-4 md:px-6 py-3 font-bold text-sm md:text-base whitespace-nowrap ${
                activeTab === 'yield'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yield History ({yieldHistory.length})
            </button>
          </div>

          {/* Holdings Tab */}
          {activeTab === 'holdings' && (
            <>
              {holdings.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No tokens yet"
                  description="Start building your portfolio by exploring and buying tokens on the platform."
                  action={
                    <Link
                      to="/explore"
                      className="bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 text-black px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-yellow-400/20"
                    >
                      Explore Tokens
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {holdings.map((holding) => (
                <div key={holding.tokenAddress} className="border border-gray-800 rounded-xl p-4 md:p-6 hover:border-gray-700 transition-colors">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0 md:justify-between">
                    <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex-shrink-0" />
                      <div className="flex-1 md:flex-initial">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                          <h3 className="text-lg md:text-xl font-bold">{holding.name}</h3>
                          <span className="text-gray-500 font-mono text-sm">{holding.symbol}</span>
                        </div>
                        <p className="text-gray-400 font-mono text-xs md:text-sm truncate">{holding.tokenAddress}</p>
                      </div>
                    </div>

                    <div className="text-left md:text-right w-full md:w-auto">
                      <div className="text-xl md:text-2xl font-bold mb-1">{holding.value}</div>
                      <div className={`text-sm ${holding.isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        {holding.valueChange}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-900">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Balance</div>
                      <div className="font-semibold text-sm md:text-base">{holding.balance} {holding.symbol}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Avg Buy</div>
                      <div className="font-semibold text-sm md:text-base">{holding.avgBuyPrice} ETH</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Current</div>
                      <div className="font-semibold text-sm md:text-base">{holding.currentPrice} ETH</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Profit/Loss</div>
                      <div className={`font-semibold text-sm md:text-base ${holding.isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        {holding.profitLoss} <span className="hidden sm:inline">({holding.profitLossPercent})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 md:gap-3 mt-4 md:mt-6">
                    <Link
                      to={`/token/${holding.tokenAddress}`}
                      className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black py-2.5 rounded-lg font-bold text-center text-sm md:text-base"
                    >
                      Trade
                    </Link>
                    <a
                      href={`https://sepolia.basescan.org/token/${holding.tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 md:px-4 border border-gray-800 hover:border-gray-700 rounded-lg flex items-center"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              ))}
                </div>
              )}
            </>
          )}

          {/* Yield History Tab */}
          {activeTab === 'yield' && (
            <>
              {yieldHistory.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="No yield claimed yet"
                  description="Hold tokens to earn yield from trading fees. Claim your rewards as they accumulate."
                  action={
                    <Link
                      to="/explore"
                      className="bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 text-black px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-yellow-400/20"
                    >
                      Start Earning
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {yieldHistory.map((item) => (
                <div key={item.id} className="border border-gray-800 rounded-xl p-5 flex items-center justify-between hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Coins className="text-black" size={20} />
                    </div>
                    <div>
                      <div className="font-bold mb-1">Yield from {item.tokenName}</div>
                      <div className="text-sm text-gray-400">{item.timestamp}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-400">{item.amount}</div>
                    <div className="text-sm text-gray-400">{item.value}</div>
                  </div>
                </div>
              ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
