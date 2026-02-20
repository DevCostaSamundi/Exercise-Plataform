import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { 
  TrendingUp, Users, Coins, ExternalLink, Activity,
  ArrowUpRight, ArrowDownRight, Loader2, Award, Flame
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TokenChart from '../components/TokenChart';
import TradingPanel from '../components/TradingPanel';
import RecentTrades from '../components/RecentTrades';
import Badge from '../components/Badge';
import FadeIn from '../components/FadeIn';
import AnimatedNumber from '../components/AnimatedNumber';
import { formatCompactNumber, formatCurrency, formatPercentage } from '../utils/format';
import { useBondingCurve } from '../hooks/useBondingCurve';
import { useYieldClaim } from '../hooks/useYieldClaim';
import { useToken } from '../hooks/useTokens';

export default function TokenDetailPage() {
  const { tokenAddress } = useParams();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('buy');
  const [amount, setAmount] = useState('');

  // Fetch token data from API
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useToken(tokenAddress);

  const { buyTokens, sellTokens, marketInfo, isTrading, calculateBuyPrice, calculateSellPrice } = useBondingCurve(tokenAddress);
  const { pendingYield, claimYield, isClaiming, poolInfo } = useYieldClaim(tokenAddress);

  // Token data - combines API data with on-chain data
  const token = tokenData ? {
    name: tokenData.name,
    symbol: tokenData.symbol,
    creator: tokenData.creatorAddress,
    creatorName: tokenData.creator?.username || tokenData.creatorAddress?.slice(0, 8) + '...',
    description: tokenData.description || 'A community token on Base Network.',
    imageUrl: tokenData.logo || '',
    price: tokenData.currentPrice || '0',
    priceChange24h: tokenData.priceChange24h || 0,
    volume24h: tokenData.volume24h || 0,
    holders: tokenData._count?.holders || tokenData.holdersCount || 0,
    marketCap: tokenData.marketCap || 0,
    totalSupply: tokenData.totalSupply || '0',
    isActive: tokenData.isActive !== false,
    twitter: tokenData.twitter,
    telegram: tokenData.telegram,
    website: tokenData.website,
    discord: tokenData.discord
  } : {
    // Fallback while loading
    name: 'Loading...',
    symbol: '...',
    creator: tokenAddress,
    creatorName: 'Loading...',
    description: '',
    imageUrl: '',
    price: '0',
    priceChange24h: 0,
    volume24h: 0,
    holders: 0,
    marketCap: 0,
    totalSupply: '0',
    isActive: true
  };

  // Calculate current price from on-chain data if available
  const currentPrice = marketInfo?.currentPrice 
    ? parseFloat(marketInfo.currentPrice) / 1e18 
    : parseFloat(token.price);

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    try {
      if (activeTab === 'buy') {
        await buyTokens(amount);
      } else {
        await sellTokens(amount);
      }
      setAmount('');
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  const handleClaimYield = async () => {
    try {
      await claimYield();
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  // Loading state
  if (tokenLoading) {
    return (
      <div className="flex min-h-screen bg-black">
        <Sidebar />
        <div className="flex-1 text-white p-4 md:p-8 flex items-center justify-center">
          <Loader2 className="animate-spin w-12 h-12 text-yellow-400" />
        </div>
      </div>
    );
  }

  // Error state
  if (tokenError) {
    return (
      <div className="flex min-h-screen bg-black">
        <Sidebar />
        <div className="flex-1 text-white p-4 md:p-8 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">Token Not Found</h2>
          <p className="text-gray-400 mb-6">The token at {tokenAddress} could not be found.</p>
          <Link to="/" className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 text-white p-4 md:p-8 pb-20 md:pb-8 overflow-x-hidden w-full md:w-auto">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Token Header */}
          <div className="border border-gray-800 rounded-xl p-4 md:p-8 mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-0">
              <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex-shrink-0" />
                <div className="flex-1">
                  <h1 className="text-2xl md:text-4xl font-black mb-2">{token.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-gray-400 text-sm md:text-base">
                    <span className="font-mono">${token.symbol}</span>
                    <span>•</span>
                    <Link to={`/creator/${token.creator}`} className="hover:text-yellow-400">
                      by {token.creator}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-end">
                {token.website && (
                  <a href={token.website} target="_blank" rel="noopener noreferrer" 
                     className="p-2 md:p-3 border border-gray-800 hover:border-gray-700 rounded-lg transition-all">
                    <ExternalLink size={16} className="md:w-5 md:h-5" />
                  </a>
                )}
                {token.twitter && (
                  <a href={token.twitter} target="_blank" rel="noopener noreferrer"
                     className="p-2 md:p-3 border border-gray-800 hover:border-gray-700 rounded-lg text-sm md:text-base transition-all flex items-center justify-center">
                    𝕏
                  </a>
                )}
                {token.telegram && (
                  <a href={token.telegram} target="_blank" rel="noopener noreferrer"
                     className="p-2 md:p-3 border border-gray-800 hover:border-gray-700 rounded-lg text-sm md:text-base transition-all flex items-center justify-center">
                    ✈
                  </a>
                )}
              </div>
            </div>

            <p className="text-gray-400 mt-4 md:mt-6 leading-relaxed text-sm md:text-base">{token.description}</p>
          </div>

          {/* Price Chart */}
          <div className="mb-6 md:mb-8">
            <TokenChart tokenAddress={tokenAddress} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
            {/* Left Column: Stats */}
            <div className="space-y-4 md:space-y-6">
              {/* Price Card */}
              <div className="border border-gray-800 hover:border-gray-700 rounded-xl p-4 md:p-6 transition-all hover:shadow-lg hover:shadow-yellow-400/10">
                <div className="text-xs md:text-sm text-gray-400 mb-1">Current Price</div>
                <div className="text-2xl md:text-3xl font-bold mb-2">{formatCurrency(parseFloat(token.price))}</div>
                <div className={`flex items-center gap-1 text-sm ${
                  parseFloat(token.priceChange24h) > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {parseFloat(token.priceChange24h) > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {formatPercentage(parseFloat(token.priceChange24h))} (24h)
                </div>
              </div>

              {/* Stats */}
              <div className="border border-gray-800 hover:border-gray-700 rounded-xl p-4 md:p-6 space-y-3 md:space-y-4 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs md:text-sm">Market Cap</span>
                  <span className="font-semibold text-sm md:text-base">{token.marketCap}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs md:text-sm">Volume (24h)</span>
                  <span className="font-semibold text-sm md:text-base">{token.volume24h}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs md:text-sm">Holders</span>
                  <span className="font-semibold text-sm md:text-base flex items-center gap-2">
                    <Users size={14} className="md:w-4 md:h-4" />
                    {token.holders.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs md:text-sm">Total Supply</span>
                  <span className="font-semibold text-sm md:text-base">{token.totalSupply}</span>
                </div>
              </div>

              {/* Yield Card */}
              {isConnected && (
                <div className="border border-yellow-800 bg-yellow-950/20 hover:bg-yellow-950/30 rounded-xl p-4 md:p-6 transition-all hover:scale-[1.02]">
                  <div className="flex items-center gap-2 mb-3">
                    <Coins className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" />
                    <span className="font-bold text-sm md:text-base">Pending Yield</span>
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-yellow-400 mb-4">
                    <AnimatedNumber value={parseFloat(pendingYield || 0)} decimals={4} suffix=" ETH" />
                  </div>
                  <button
                    onClick={handleClaimYield}
                    disabled={isClaiming || parseFloat(pendingYield) <= 0}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 text-black py-2.5 md:py-3 rounded-lg font-bold disabled:opacity-50 disabled:hover:scale-100 text-sm md:text-base transition-all shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40"
                  >
                    {isClaiming ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={18} />
                        Claiming...
                      </span>
                    ) : (
                      'Claim Yield'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Trading */}
            <div className="lg:col-span-2">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Trade</h2>
              
              <TradingPanel
                tokenAddress={tokenAddress}
                tokenSymbol={token.symbol}
                currentPrice={currentPrice}
                onBuy={buyTokens}
                onSell={sellTokens}
                isTrading={isTrading}
              />

              {/* Info */}
              <div className="mt-6 border border-blue-800 bg-blue-950/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <Activity className="text-blue-400 flex-shrink-0" size={20} />
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-blue-400 mb-1">Bonding Curve Trading</p>
                    <p>Price automatically adjusts based on supply and demand. 1% fee distributed to all holders as yield.</p>
                  </div>
                </div>
              </div>

              {/* Recent Trades */}
              <div className="mt-6">
                <RecentTrades tokenAddress={tokenAddress} limit={10} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
