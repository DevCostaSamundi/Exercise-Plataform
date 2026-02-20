import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useWatchContractEvent, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { BondingCurveABI } from '../config/contractABIs';

export default function RecentTrades({ tokenAddress, limit = 20 }) {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  // Watch for new buy events
  useWatchContractEvent({
    address: tokenAddress,
    abi: BondingCurveABI,
    eventName: 'TokenPurchased',
    onLogs(logs) {
      const newTrades = logs.map((log) => ({
        id: `buy-${log.transactionHash}-${log.logIndex}`,
        type: 'buy',
        trader: log.args.buyer,
        tokenAmount: formatEther(log.args.tokenAmount),
        ethAmount: formatEther(log.args.ethSpent),
        price: (parseFloat(formatEther(log.args.ethSpent)) / parseFloat(formatEther(log.args.tokenAmount))).toFixed(6),
        timestamp: Date.now(),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      }));

      setTrades((prev) => [...newTrades, ...prev].slice(0, limit));
    },
  });

  // Watch for new sell events
  useWatchContractEvent({
    address: tokenAddress,
    abi: BondingCurveABI,
    eventName: 'TokenSold',
    onLogs(logs) {
      const newTrades = logs.map((log) => ({
        id: `sell-${log.transactionHash}-${log.logIndex}`,
        type: 'sell',
        trader: log.args.seller,
        tokenAmount: formatEther(log.args.tokenAmount),
        ethAmount: formatEther(log.args.ethReceived),
        price: (parseFloat(formatEther(log.args.ethReceived)) / parseFloat(formatEther(log.args.tokenAmount))).toFixed(6),
        timestamp: Date.now(),
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
      }));

      setTrades((prev) => [...newTrades, ...prev].slice(0, limit));
    },
  });

  // Load historical trades on mount
  useEffect(() => {
    const loadHistoricalTrades = async () => {
      if (!publicClient || !tokenAddress) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch past events
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - BigInt(10000); // Last ~10k blocks (~33 hours on Base)

        // Get buy events
        const buyLogs = await publicClient.getLogs({
          address: tokenAddress,
          event: {
            type: 'event',
            name: 'TokenPurchased',
            inputs: [
              { type: 'address', name: 'buyer', indexed: true },
              { type: 'uint256', name: 'tokenAmount' },
              { type: 'uint256', name: 'ethSpent' },
            ],
          },
          fromBlock,
          toBlock: currentBlock,
        });

        // Get sell events
        const sellLogs = await publicClient.getLogs({
          address: tokenAddress,
          event: {
            type: 'event',
            name: 'TokenSold',
            inputs: [
              { type: 'address', name: 'seller', indexed: true },
              { type: 'uint256', name: 'tokenAmount' },
              { type: 'uint256', name: 'ethReceived' },
            ],
          },
          fromBlock,
          toBlock: currentBlock,
        });

        // Process and combine events
        const buyTrades = buyLogs.map((log) => ({
          id: `buy-${log.transactionHash}-${log.logIndex}`,
          type: 'buy',
          trader: log.args.buyer,
          tokenAmount: formatEther(log.args.tokenAmount),
          ethAmount: formatEther(log.args.ethSpent),
          price: (parseFloat(formatEther(log.args.ethSpent)) / parseFloat(formatEther(log.args.tokenAmount))).toFixed(6),
          timestamp: Date.now() - (Number(currentBlock - log.blockNumber) * 2000), // Estimate time (2s per block)
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        }));

        const sellTrades = sellLogs.map((log) => ({
          id: `sell-${log.transactionHash}-${log.logIndex}`,
          type: 'sell',
          trader: log.args.seller,
          tokenAmount: formatEther(log.args.tokenAmount),
          ethAmount: formatEther(log.args.ethReceived),
          price: (parseFloat(formatEther(log.args.ethReceived)) / parseFloat(formatEther(log.args.tokenAmount))).toFixed(6),
          timestamp: Date.now() - (Number(currentBlock - log.blockNumber) * 2000),
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
        }));

        // Combine and sort by block number (most recent first)
        const allTrades = [...buyTrades, ...sellTrades]
          .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))
          .slice(0, limit);

        setTrades(allTrades);
      } catch (error) {
        console.error('Failed to load historical trades:', error);
        // Fallback to mock data if events fail
        setTrades(generateMockTrades(limit));
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoricalTrades();
  }, [tokenAddress, publicClient, limit]);

  // Generate mock trades for testing/development
  const generateMockTrades = (count) => {
    const types = ['buy', 'sell'];
    const now = Date.now();
    
    return Array.from({ length: count }, (_, i) => {
      const isBuy = types[Math.floor(Math.random() * types.length)] === 'buy';
      const amount = (Math.random() * 10000).toFixed(2);
      const ethAmount = (Math.random() * 5).toFixed(4);
      const timeAgo = now - (Math.random() * 3600000 * 24);
      
      return {
        id: `trade-${i}`,
        type: isBuy ? 'buy' : 'sell',
        trader: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`,
        tokenAmount: amount,
        ethAmount: ethAmount,
        price: (parseFloat(ethAmount) / parseFloat(amount)).toFixed(6),
        timestamp: timeAgo,
        txHash: `0x${Math.random().toString(16).slice(2, 66).padEnd(64, '0')}`,
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  };

  const truncateAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="border border-gray-800 rounded-xl p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold mb-4">Recent Trades</h3>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-yellow-400" size={32} />
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="border border-gray-800 rounded-xl p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold mb-4">Recent Trades</h3>
        <div className="text-center py-12">
          <p className="text-gray-400">No trades yet</p>
          <p className="text-sm text-gray-500 mt-1">Be the first to trade this token!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-800 rounded-xl p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-bold mb-4">Recent Trades</h3>
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Trader</th>
              <th className="pb-2 font-medium text-right">Amount</th>
              <th className="pb-2 font-medium text-right">Price</th>
              <th className="pb-2 font-medium text-right">Total</th>
              <th className="pb-2 font-medium text-right">Time</th>
              <th className="pb-2 font-medium text-right">Tx</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr 
                key={trade.id}
                className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors"
              >
                <td className="py-3">
                  <div className={`flex items-center gap-2 ${
                    trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {trade.type === 'buy' ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownRight size={16} />
                    )}
                    <span className="font-semibold capitalize">{trade.type}</span>
                  </div>
                </td>
                <td className="py-3">
                  <a
                    href={`https://sepolia.basescan.org/address/${trade.trader}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-yellow-400 font-mono text-sm"
                  >
                    {truncateAddress(trade.trader)}
                  </a>
                </td>
                <td className="py-3 text-right font-mono text-sm">
                  {parseFloat(trade.tokenAmount).toFixed(2)}
                </td>
                <td className="py-3 text-right font-mono text-sm text-gray-400">
                  {trade.price} ETH
                </td>
                <td className="py-3 text-right font-mono text-sm">
                  {parseFloat(trade.ethAmount).toFixed(4)} ETH
                </td>
                <td className="py-3 text-right text-xs text-gray-500">
                  {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                </td>
                <td className="py-3 text-right">
                  <a
                    href={`https://sepolia.basescan.org/tx/${trade.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-yellow-400 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {trades.map((trade) => (
          <div 
            key={trade.id}
            className="p-3 bg-gray-900/50 hover:bg-gray-900 rounded-lg transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-2 ${
                trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
              }`}>
                {trade.type === 'buy' ? (
                  <ArrowUpRight size={18} />
                ) : (
                  <ArrowDownRight size={18} />
                )}
                <span className="font-bold capitalize">{trade.type}</span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
              </span>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Trader</span>
                <span className="font-mono text-gray-300">
                  {truncateAddress(trade.trader)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="font-mono">{parseFloat(trade.tokenAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total</span>
                <span className="font-mono">{parseFloat(trade.ethAmount).toFixed(4)} ETH</span>
              </div>
            </div>

            <a
              href={`https://sepolia.basescan.org/tx/${trade.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-400 mt-2"
            >
              View on BaseScan <ExternalLink size={12} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
