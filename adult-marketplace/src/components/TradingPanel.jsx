import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function TradingPanel({ 
  tokenAddress, 
  tokenSymbol, 
  currentPrice,
  onBuy, 
  onSell,
  isTrading 
}) {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [estimatedReceive, setEstimatedReceive] = useState('0');
  const [slippage, setSlippage] = useState('0.5'); // Default 0.5%
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // Get Token balance (mock for now - would be actual token balance)
  const tokenBalance = '0'; // TODO: Get from contract

  // Calculate estimates when amount changes
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0 || !currentPrice) {
      setEstimatedCost('0');
      setEstimatedReceive('0');
      return;
    }

    const amountNum = parseFloat(amount);
    const priceNum = parseFloat(currentPrice);
    
    if (activeTab === 'buy') {
      // Calculate cost with slippage
      const baseCost = amountNum * priceNum;
      const slippageAmount = baseCost * (parseFloat(slippage) / 100);
      const platformFee = baseCost * 0.01; // 1% platform fee
      const totalCost = baseCost + slippageAmount + platformFee;
      setEstimatedCost(totalCost.toFixed(6));
    } else {
      // Calculate receive with slippage
      const baseReceive = amountNum * priceNum;
      const slippageAmount = baseReceive * (parseFloat(slippage) / 100);
      const platformFee = baseReceive * 0.01; // 1% platform fee
      const totalReceive = baseReceive - slippageAmount - platformFee;
      setEstimatedReceive(Math.max(0, totalReceive).toFixed(6));
    }
  }, [amount, currentPrice, slippage, activeTab]);

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Check balance
    if (activeTab === 'buy') {
      const ethBalanceNum = ethBalance ? parseFloat(formatEther(ethBalance.value)) : 0;
      if (parseFloat(estimatedCost) > ethBalanceNum) {
        toast.error('Insufficient ETH balance');
        return;
      }
    } else {
      if (parseFloat(amount) > parseFloat(tokenBalance)) {
        toast.error(`Insufficient ${tokenSymbol} balance`);
        return;
      }
    }

    try {
      if (activeTab === 'buy') {
        await onBuy(amount);
      } else {
        await onSell(amount);
      }
      setAmount(''); // Clear input after successful trade
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  const setMaxAmount = () => {
    if (activeTab === 'buy' && ethBalance) {
      // Set to 95% of ETH balance to leave room for gas
      const maxEth = parseFloat(formatEther(ethBalance.value)) * 0.95;
      const maxTokens = maxEth / parseFloat(currentPrice || 1);
      setAmount(maxTokens.toFixed(2));
    } else {
      setAmount(tokenBalance);
    }
  };

  const priceImpact = estimatedCost !== '0' 
    ? ((parseFloat(estimatedCost) - (parseFloat(amount) * parseFloat(currentPrice))) / parseFloat(estimatedCost) * 100).toFixed(2)
    : '0';

  return (
    <div className="border border-gray-800 rounded-xl p-4 md:p-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'buy'
              ? 'bg-green-500 text-white'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <ArrowUpRight size={18} />
            Buy
          </span>
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
            activeTab === 'sell'
              ? 'bg-red-500 text-white'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <ArrowDownRight size={18} />
            Sell
          </span>
        </button>
      </div>

      {/* Current Price */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Current Price</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-500" size={16} />
            <span className="font-bold text-lg">{currentPrice || '0.00'} ETH</span>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-400">
            {activeTab === 'buy' ? 'Amount to Buy' : 'Amount to Sell'}
          </label>
          <button
            onClick={setMaxAmount}
            className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold"
          >
            MAX
          </button>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 pr-20 text-lg focus:border-yellow-400 focus:outline-none"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
            {tokenSymbol}
          </span>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-6 text-sm text-gray-400">
        <div className="flex justify-between">
          <span>Your Balance:</span>
          <span className="font-mono">
            {activeTab === 'buy' 
              ? `${ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : '0.0000'} ETH`
              : `${tokenBalance} ${tokenSymbol}`
            }
          </span>
        </div>
      </div>

      {/* Estimate */}
      {amount && parseFloat(amount) > 0 && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">
              {activeTab === 'buy' ? 'You Pay' : 'You Receive'}
            </span>
            <span className="font-bold">
              {activeTab === 'buy' ? `${estimatedCost} ETH` : `${estimatedReceive} ETH`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Platform Fee (1%)</span>
            <span className="font-mono text-xs">
              {(parseFloat(amount) * parseFloat(currentPrice) * 0.01).toFixed(6)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Max Slippage</span>
            <span className="font-mono text-xs text-yellow-400">{slippage}%</span>
          </div>
          {parseFloat(priceImpact) > 1 && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
              <AlertCircle className="text-orange-500" size={16} />
              <span className="text-orange-500 text-xs">
                High price impact: {priceImpact}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Advanced Settings */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-sm text-gray-400 hover:text-white mb-4 text-left"
      >
        {showAdvanced ? '▼' : '▶'} Advanced Settings
      </button>

      {showAdvanced && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg">
          <label className="block text-sm text-gray-400 mb-2">
            Slippage Tolerance (%)
          </label>
          <div className="flex gap-2">
            {['0.1', '0.5', '1.0'].map((preset) => (
              <button
                key={preset}
                onClick={() => setSlippage(preset)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  slippage === preset
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {preset}%
              </button>
            ))}
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              placeholder="Custom"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none"
              step="0.1"
              min="0.1"
              max="50"
            />
          </div>
        </div>
      )}

      {/* Trade Button */}
      <button
        onClick={handleTrade}
        disabled={isTrading || !amount || parseFloat(amount) <= 0}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
          activeTab === 'buy'
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-red-500 hover:bg-red-600 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      >
        {isTrading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Processing...
          </>
        ) : (
          <>
            {activeTab === 'buy' ? 'Buy' : 'Sell'} {tokenSymbol}
          </>
        )}
      </button>

      {/* Warning */}
      {!address && (
        <p className="mt-4 text-center text-sm text-gray-500">
          Connect wallet to trade
        </p>
      )}
    </div>
  );
}
