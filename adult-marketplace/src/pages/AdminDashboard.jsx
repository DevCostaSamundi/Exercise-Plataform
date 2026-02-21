import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { toast } from 'sonner';
import { 
  Shield, DollarSign, Coins, Users, TrendingUp, 
  Settings, Pause, Play, Download, AlertCircle,
  Sparkles, Brain, Rocket, Clock, Target, Zap, Loader2, RefreshCw
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { CONTRACTS } from '../config/constants';
import { usePlatformStats } from '../hooks/useTokens';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function AdminDashboard() {
  const { address } = useAccount();
  const [selectedContract, setSelectedContract] = useState('factory');
  const [activeTab, setActiveTab] = useState('overview');
  const { writeContractAsync } = useWriteContract();

  // AI Marketing state
  const [aiLoading, setAiLoading] = useState({});
  const [aiData, setAiData] = useState({
    marketingStrategy: null,
    tokenAdvice: null,
    buyerStrategies: null,
    viralContent: null,
    optimalTiming: null,
    competitors: null
  });

  // Fetch AI data
  const fetchAiEndpoint = async (endpoint, key) => {
    setAiLoading(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/ai/${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': address || '',
          ...(token && { Authorization: `Bearer ${token}` }),
        }
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Failed to fetch ${endpoint}`);
      }
      
      const data = await response.json();
      setAiData(prev => ({ ...prev, [key]: data }));
      toast.success(`AI ${key} generated!`);
    } catch (error) {
      console.error(`AI ${endpoint} error:`, error);
      toast.error(error.message || `Failed to get ${key}`);
    } finally {
      setAiLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Verifica se a wallet conectada é do OWNER
  const OWNER_WALLET = import.meta.env.VITE_OWNER_WALLET || '';
  const isOwner = address?.toLowerCase() === OWNER_WALLET.toLowerCase();

  // Read contract metrics
  const { data: totalTokens } = useReadContract({
    address: CONTRACTS.TOKEN_FACTORY,
    abi: [{
      name: 'getTotalTokensCreated',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }]
    }],
    functionName: 'getTotalTokensCreated',
    enabled: isOwner,
  });

  const { data: totalFees } = useReadContract({
    address: CONTRACTS.TOKEN_FACTORY,
    abi: [{
      name: 'getAccumulatedFees',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint256' }]
    }],
    functionName: 'getAccumulatedFees',
    enabled: isOwner,
  });

  const { data: isPaused } = useReadContract({
    address: CONTRACTS.TOKEN_FACTORY,
    abi: [{
      name: 'paused',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'bool' }]
    }],
    functionName: 'paused',
    enabled: isOwner,
  });

  // Fetch real platform stats
  const { data: statsData } = usePlatformStats();
  const metrics = statsData || {
    totalVolume: '0 ETH',
    uniqueUsers: '0',
    avgTokenPrice: '0 ETH',
    totalYieldDistributed: '0 ETH',
  };

  const handleWithdrawFees = async () => {
    const toastId = toast.loading('Withdrawing fees...');
    try {
      await writeContractAsync({
        address: CONTRACTS.TOKEN_FACTORY,
        abi: [{
          name: 'withdrawFees',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [],
          outputs: []
        }],
        functionName: 'withdrawFees',
      });
      toast.success(`Withdrawn ${formatEther(totalFees || 0n)} ETH`, { id: toastId });
    } catch (error) {
      toast.error('Withdrawal failed', { id: toastId });
    }
  };

  const handleTogglePause = async () => {
    const toastId = toast.loading(isPaused ? 'Resuming...' : 'Pausing...');
    try {
      await writeContractAsync({
        address: CONTRACTS.TOKEN_FACTORY,
        abi: [{
          name: isPaused ? 'unpause' : 'pause',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [],
          outputs: []
        }],
        functionName: isPaused ? 'unpause' : 'pause',
      });
      toast.success(isPaused ? 'Contract resumed' : 'Contract paused', { id: toastId });
    } catch (error) {
      toast.error('Operation failed', { id: toastId });
    }
  };

  if (!address) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
            <p className="text-gray-400">Please connect your wallet</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-black text-white flex items-center justify-center p-4 md:p-8 pb-20 md:pb-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-400">This dashboard is only accessible to the contract owner</p>
            <p className="text-sm text-gray-600 mt-2 font-mono">{address}</p>
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
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <Shield className="text-yellow-400" size={24} />
              <h1 className="text-3xl md:text-4xl font-black">Admin Dashboard</h1>
            </div>
            <p className="text-gray-400 text-sm md:text-base">Platform metrics and controls</p>
            
            {/* Tabs */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'overview'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === 'ai'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles size={16} />
                AI Marketing
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="border border-gray-800 rounded-xl p-6 bg-gradient-to-br from-yellow-950/20 to-transparent">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-400/10 rounded-lg">
                  <DollarSign className="text-yellow-400" size={24} />
                </div>
                <span className="text-sm text-gray-400">Total Fees</span>
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                {totalFees ? formatEther(totalFees) : '0'} ETH
              </div>
            </div>

            <div className="border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-400/10 rounded-lg">
                  <Coins className="text-blue-400" size={24} />
                </div>
                <span className="text-sm text-gray-400">Tokens Created</span>
              </div>
              <div className="text-3xl font-bold">
                {totalTokens ? totalTokens.toString() : '0'}
              </div>
            </div>

            <div className="border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-400/10 rounded-lg">
                  <TrendingUp className="text-green-400" size={24} />
                </div>
                <span className="text-sm text-gray-400">Total Volume</span>
              </div>
              <div className="text-3xl font-bold">
                {metrics.totalVolume}
              </div>
            </div>

            <div className="border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-400/10 rounded-lg">
                  <Users className="text-purple-400" size={24} />
                </div>
                <span className="text-sm text-gray-400">Unique Users</span>
              </div>
              <div className="text-3xl font-bold">
                {metrics.uniqueUsers}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Fee Management */}
            <div className="border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Fee Management
              </h2>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Available Fees</span>
                  <span className="font-bold text-yellow-400">
                    {totalFees ? formatEther(totalFees) : '0'} ETH
                  </span>
                </div>
              </div>

              <button
                onClick={handleWithdrawFees}
                disabled={!totalFees || totalFees === 0n}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Withdraw Fees
              </button>
            </div>

            {/* Contract Controls */}
            <div className="border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings size={20} />
                Contract Controls
              </h2>

              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Contract Status</span>
                  <span className={`font-bold ${isPaused ? 'text-red-500' : 'text-green-500'}`}>
                    {isPaused ? 'PAUSED' : 'ACTIVE'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleTogglePause}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
                  isPaused 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
                {isPaused ? 'Resume Contract' : 'Pause Contract'}
              </button>

              <p className="text-xs text-gray-500 mt-3">
                ⚠️ Pausing will prevent all new token creations and trades
              </p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Platform Statistics</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Avg Token Price</div>
                <div className="text-xl font-bold">{metrics.avgTokenPrice}</div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Total Yield Distributed</div>
                <div className="text-xl font-bold">{metrics.totalYieldDistributed}</div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Contract Address</div>
                <div className="text-sm font-mono text-yellow-400">
                  {CONTRACTS.TOKEN_FACTORY.slice(0, 10)}...{CONTRACTS.TOKEN_FACTORY.slice(-8)}
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {/* AI Marketing Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* AI Header */}
              <div className="border border-purple-900/50 rounded-xl p-6 bg-gradient-to-br from-purple-950/30 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Brain className="text-purple-400" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI Marketing Intelligence</h2>
                    <p className="text-gray-400 text-sm">Powered by GPT-4 Mini</p>
                  </div>
                </div>
                <p className="text-gray-400">
                  Use AI to generate marketing strategies, detect viral trends, and optimize your token launches.
                </p>
              </div>

              {/* AI Cards Grid */}
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Marketing Strategy */}
                <div className="border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Target className="text-yellow-400" size={20} />
                      Marketing Strategy
                    </h3>
                    <button
                      onClick={() => fetchAiEndpoint('marketing-strategy', 'marketingStrategy')}
                      disabled={aiLoading.marketingStrategy}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {aiLoading.marketingStrategy ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      Generate
                    </button>
                  </div>
                  
                  {aiData.marketingStrategy ? (
                    <div className="bg-gray-900 rounded-lg p-4 text-sm space-y-3">
                      <div>
                        <span className="text-purple-400 font-semibold">Strategy:</span>
                        <p className="text-gray-300 mt-1">{aiData.marketingStrategy.strategy || aiData.marketingStrategy.message || JSON.stringify(aiData.marketingStrategy)}</p>
                      </div>
                      {aiData.marketingStrategy.tips && (
                        <div>
                          <span className="text-purple-400 font-semibold">Tips:</span>
                          <ul className="list-disc list-inside text-gray-300 mt-1">
                            {(Array.isArray(aiData.marketingStrategy.tips) ? aiData.marketingStrategy.tips : [aiData.marketingStrategy.tips]).map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-500">
                      <Target className="mx-auto mb-2 text-gray-700" size={32} />
                      <p className="text-sm">Click "Generate" to get AI marketing strategy</p>
                    </div>
                  )}
                </div>

                {/* Token Launch Advice */}
                <div className="border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Rocket className="text-orange-400" size={20} />
                      Token Launch Advice
                    </h3>
                    <button
                      onClick={() => fetchAiEndpoint('token-launch-advice', 'tokenAdvice')}
                      disabled={aiLoading.tokenAdvice}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {aiLoading.tokenAdvice ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      Generate
                    </button>
                  </div>
                  
                  {aiData.tokenAdvice ? (
                    <div className="bg-gray-900 rounded-lg p-4 text-sm">
                      <p className="text-gray-300">{aiData.tokenAdvice.advice || aiData.tokenAdvice.message || JSON.stringify(aiData.tokenAdvice)}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-500">
                      <Rocket className="mx-auto mb-2 text-gray-700" size={32} />
                      <p className="text-sm">Get AI suggestions for token launches</p>
                    </div>
                  )}
                </div>

                {/* Buyer Strategies */}
                <div className="border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Users className="text-green-400" size={20} />
                      Buyer Attraction
                    </h3>
                    <button
                      onClick={() => fetchAiEndpoint('buyer-strategies', 'buyerStrategies')}
                      disabled={aiLoading.buyerStrategies}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {aiLoading.buyerStrategies ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      Generate
                    </button>
                  </div>
                  
                  {aiData.buyerStrategies ? (
                    <div className="bg-gray-900 rounded-lg p-4 text-sm">
                      <p className="text-gray-300">{aiData.buyerStrategies.strategies || aiData.buyerStrategies.message || JSON.stringify(aiData.buyerStrategies)}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-500">
                      <Users className="mx-auto mb-2 text-gray-700" size={32} />
                      <p className="text-sm">Strategies to attract more buyers</p>
                    </div>
                  )}
                </div>

                {/* Viral Content */}
                <div className="border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Zap className="text-pink-400" size={20} />
                      Viral Content Ideas
                    </h3>
                    <button
                      onClick={() => fetchAiEndpoint('viral-content', 'viralContent')}
                      disabled={aiLoading.viralContent}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {aiLoading.viralContent ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      Generate
                    </button>
                  </div>
                  
                  {aiData.viralContent ? (
                    <div className="bg-gray-900 rounded-lg p-4 text-sm">
                      <p className="text-gray-300">{aiData.viralContent.content || aiData.viralContent.message || JSON.stringify(aiData.viralContent)}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-500">
                      <Zap className="mx-auto mb-2 text-gray-700" size={32} />
                      <p className="text-sm">Detect and adapt viral crypto trends</p>
                    </div>
                  )}
                </div>

                {/* Optimal Timing */}
                <div className="border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Clock className="text-blue-400" size={20} />
                      Optimal Posting Times
                    </h3>
                    <button
                      onClick={() => fetchAiEndpoint('optimal-timing', 'optimalTiming')}
                      disabled={aiLoading.optimalTiming}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {aiLoading.optimalTiming ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      Generate
                    </button>
                  </div>
                  
                  {aiData.optimalTiming ? (
                    <div className="bg-gray-900 rounded-lg p-4 text-sm">
                      <p className="text-gray-300">{aiData.optimalTiming.timing || aiData.optimalTiming.message || JSON.stringify(aiData.optimalTiming)}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-500">
                      <Clock className="mx-auto mb-2 text-gray-700" size={32} />
                      <p className="text-sm">Best times to post for engagement</p>
                    </div>
                  )}
                </div>

                {/* Competitor Analysis */}
                <div className="border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="text-cyan-400" size={20} />
                      Competitor Insights
                    </h3>
                    <button
                      onClick={() => fetchAiEndpoint('competitors', 'competitors')}
                      disabled={aiLoading.competitors}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {aiLoading.competitors ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                      Generate
                    </button>
                  </div>
                  
                  {aiData.competitors ? (
                    <div className="bg-gray-900 rounded-lg p-4 text-sm">
                      <p className="text-gray-300">{aiData.competitors.insights || aiData.competitors.message || JSON.stringify(aiData.competitors)}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-500">
                      <TrendingUp className="mx-auto mb-2 text-gray-700" size={32} />
                      <p className="text-sm">Analyze competitor strategies</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Generate All Button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    fetchAiEndpoint('marketing-strategy', 'marketingStrategy');
                    fetchAiEndpoint('token-launch-advice', 'tokenAdvice');
                    fetchAiEndpoint('buyer-strategies', 'buyerStrategies');
                    fetchAiEndpoint('viral-content', 'viralContent');
                    fetchAiEndpoint('optimal-timing', 'optimalTiming');
                    fetchAiEndpoint('competitors', 'competitors');
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold flex items-center gap-2 mx-auto"
                >
                  <Brain size={20} />
                  Generate All AI Insights
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  This will make 6 API calls to OpenAI
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
