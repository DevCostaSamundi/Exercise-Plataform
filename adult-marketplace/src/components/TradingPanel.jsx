import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useBondingCurve } from '../hooks/useBondingCurve';
import { transactionToast } from '../hooks/useTransactionNotification.jsx';

export default function TradingPanel({ 
  tokenAddress, 
  tokenSymbol
}) {
  const { address } = useAccount();
  const { buyTokens, sellTokens, calculateBuyPrice, calculateSellPrice, marketInfo, isTrading } = useBondingCurve(tokenAddress);
  
  const [activeTab, setActiveTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('0');
  const [slippage, setSlippage] = useState(5); // Default 5%
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
  });

  // Get Token balance - TODO: implement with ERC20 balanceOf
  const tokenBalance = '0'; // TODO: Get from token contract

  // Calculate estimates when amount changes
  useEffect(() => {
    const calculateEstimate = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setEstimatedPrice('0');
        return;
      }

      try {
        const amountNum = parseFloat(amount);
        
        if (activeTab === 'buy') {
          // Get price for buying tokens (ETH cost)
          const ethCost = await calculateBuyPrice(parseEther(amount));
          setEstimatedPrice(ethCost ? formatEther(ethCost) : '0');
        } else {
          // Get price for selling tokens (ETH received)
          const ethReceived = await calculateSellPrice(parseEther(amount));
          setEstimatedPrice(ethReceived ? formatEther(ethReceived) : '0');
        }
      } catch (error) {
        console.error('Price calculation failed:', error);
        setEstimatedPrice('0');
      }
    };

    calculateEstimate();
  }, [amount, activeTab, calculateBuyPrice, calculateSellPrice]);

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    // Check balance
    if (activeTab === 'buy') {
      const ethBalanceNum = ethBalance ? parseFloat(formatEther(ethBalance.value)) : 0;
      if (parseFloat(estimatedPrice) > ethBalanceNum) {
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
      let toastId;
      
      if (activeTab === 'buy') {
        toastId = transactionToast.pending('Transaction submitted...');
        
        const tx = await buyTokens(parseEther(amount), slippage);
        
        if (tx) {
          toast.dismiss(toastId);
          transactionToast.success(tx, `Successfully bought ${amount} ${tokenSymbol}!`);
          setAmount(''); // Clear input after successful trade
        }
      } else {
        toastId = transactionToast.pending('Transaction submitted...');
        
        const tx = await sellTokens(parseEther(amount), slippage);
        
        if (tx) {
          toast.dismiss(toastId);
          transactionToast.success(tx, `Successfully sold ${amount} ${tokenSymbol}!`);
          setAmount(''); // Clear input after successful trade
        }
      }
    } catch (error) {
      console.error('Trade failed:', error);
      
      // Parse error message for better UX
      let errorMsg = 'Transaction failed';
      if (error.message?.includes('User rejected')) {
        errorMsg = 'Transaction rejected';
      } else if (error.message?.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for transaction';
      } else if (error.message?.includes('slippage')) {
        errorMsg = 'Price moved too much. Try increasing slippage tolerance';
      }
      
      transactionToast.error(errorMsg, error.message);

    }
  };

  const setMaxAmount = () => {
    if (activeTab === 'buy' && ethBalance) {
      // Set to 95% of ETH balance to leave room for gas
      const maxEth = parseFloat(formatEther(ethBalance.value)) * 0.95;
      // Estimate how many tokens we can buy with this ETH
      setAmount(maxEth.toFixed(4));
    } else {
      setAmount(tokenBalance);
    }
  };

  const priceImpact = marketInfo && estimatedPrice !== '0' 
    ? ((parseFloat(estimatedPrice) / parseFloat(amount || 1) - parseFloat(formatEther(marketInfo.currentPrice || '0'))) / parseFloat(formatEther(marketInfo.currentPrice || '1')) * 100).toFixed(2)
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

      {/* Current Price & Market Info */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Current Price</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-500" size={16} />
            <span className="font-bold text-lg">
              {marketInfo ? formatEther(marketInfo.currentPrice) : '0.00'} ETH
            </span>
          </div>
        </div>
        
        {marketInfo && (
          <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-800">
            <div>
              <span className="block text-gray-400">Total Supply</span>
              <span>{formatEther(marketInfo.totalSupply)}</span>
            </div>
            <div className="text-right">
              <span className="block text-gray-400">Reserve</span>
              <span>{formatEther(marketInfo.reserveBalance)} ETH</span>
            </div>
          </div>
        )}
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
              {activeTab === 'buy' ? 'You Pay (estimated)' : 'You Receive (estimated)'}
            </span>
            <span className="font-bold">
              {estimatedPrice !== '0' ? `${parseFloat(estimatedPrice).toFixed(6)} ETH` : 'Calculating...'}
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
                Price impact: {priceImpact}%
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
            {[1, 5, 10].map((preset) => (
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
              onChange={(e) => setSlippage(parseFloat(e.target.value) || 5)}
              placeholder="Custom"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none"
              step="1"
              min="1"
              max="50"
            />
          </div>
        </div>
      )}

      {/* Trade Button */}
      <button
        onClick={handleTrade}
        disabled={isTrading || !amount || parseFloat(amount) <= 0 || !address}
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
        ) : !address ? (
          'Connect Wallet'
        ) : (
          <>
            {activeTab === 'buy' ? 'Buy' : 'Sell'} {tokenSymbol}
          </>
        )}
      </button>

      {/* Info */}
      <div className="mt-4 flex items-start gap-2 p-3 bg-gray-900/50 rounded-lg">
        <Info className="text-gray-500 mt-0.5 flex-shrink-0" size={16} />
        <p className="text-xs text-gray-500">
          Prices are calculated using the bonding curve formula. Higher slippage allows larger price movements but reduces failed transactions.
        </p>
      </div>
    </div>
  );
}
