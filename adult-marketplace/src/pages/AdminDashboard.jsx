import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { toast } from 'sonner';
import { 
  Shield, DollarSign, Coins, Users, TrendingUp, 
  Settings, Pause, Play, Download, AlertCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { CONTRACTS } from '../config/constants';

export default function AdminDashboard() {
  const { address } = useAccount();
  const [selectedContract, setSelectedContract] = useState('factory');
  const { writeContractAsync } = useWriteContract();

  // Check if user is owner (you need to set your wallet address here)
  const OWNER_ADDRESS = import.meta.env.VITE_OWNER_ADDRESS || '0x0000000000000000000000000000000000000000';
  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

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

  // Mock data (replace with real subgraph data)
  const metrics = {
    totalVolume: '1,250.45 ETH',
    uniqueUsers: '2,847',
    avgTokenPrice: '0.0015 ETH',
    totalYieldDistributed: '125.30 ETH',
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
          </div>

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

        </div>
      </div>
    </div>
  );
}
