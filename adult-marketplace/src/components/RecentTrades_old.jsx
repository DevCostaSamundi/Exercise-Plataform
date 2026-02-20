import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RecentTrades({ tokenAddress, limit = 20 }) {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real data from subgraph or events
    const mockTrades = generateMockTrades(limit);
    setTrades(mockTrades);
    setIsLoading(false);
  }, [tokenAddress, limit]);

  const generateMockTrades = (count) => {
    const types = ['buy', 'sell'];
    const now = Date.now();
    
    return Array.from({ length: count }, (_, i) => {
      const isBuy = types[Math.floor(Math.random() * types.length)] === 'buy';
      const amount = (Math.random() * 10000).toFixed(2);
      const ethAmount = (Math.random() * 5).toFixed(4);
      const timeAgo = now - (Math.random() * 3600000 * 24); // Random time in last 24h
      
      return {
        id: `trade-${i}`,
        type: isBuy ? 'buy' : 'sell',
        trader: `0x${Math.random().toString(16).slice(2, 10)}`,
        tokenAmount: amount,
        ethAmount: ethAmount,
        price: (parseFloat(ethAmount) / parseFloat(amount)).toFixed(6),
        timestamp: timeAgo,
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  };

  if (isLoading) {
    return (
      <div className="border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Recent Trades</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-800 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Recent Trades</h3>
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
      
      <div className="space-y-2">
        {trades.map((trade) => (
          <div 
            key={trade.id}
            className="flex items-center gap-3 p-3 bg-gray-900/50 hover:bg-gray-900 rounded-lg transition-colors group"
          >
            {/* Buy/Sell Indicator */}
            <div className={`p-2 rounded-lg ${
              trade.type === 'buy' 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-red-500/10 text-red-400'
            }`}>
              {trade.type === 'buy' ? (
                <ArrowUpRight size={16} />
              ) : (
                <ArrowDownRight size={16} />
              )}
            </div>

            {/* Trade Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-bold ${
                  trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trade.type === 'buy' ? 'BUY' : 'SELL'}
                </span>
                <span className="text-sm font-mono text-gray-400 truncate">
                  by {trade.trader.slice(0, 6)}...{trade.trader.slice(-4)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-mono">{Number(trade.tokenAmount).toLocaleString()} tokens</span>
                <span>•</span>
                <span className="font-mono">{trade.ethAmount} ETH</span>
              </div>
            </div>

            {/* Price & Time */}
            <div className="text-right">
              <div className="text-sm font-mono font-bold mb-1">
                {trade.price} ETH
              </div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
              </div>
            </div>

            {/* TX Link */}
            <a
              href={`https://basescan.org/tx/${trade.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-800 rounded-lg"
              title="View on BaseScan"
            >
              <ExternalLink size={14} className="text-gray-400" />
            </a>
          </div>
        ))}
      </div>

      {/* View All Link */}
      {trades.length >= limit && (
        <div className="mt-4 text-center">
          <button className="text-sm text-yellow-400 hover:text-yellow-300 font-semibold">
            View all trades →
          </button>
        </div>
      )}
    </div>
  );
}
