import { useState } from 'react';
import { ExternalLink, Copy, Check, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function TokenManagementCard({ token }) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(token.address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { icon: Users, label: 'Holders', value: token.holders, color: 'text-blue-400' },
    { icon: DollarSign, label: '24h Vol', value: token.volume24h, color: 'text-green-400' },
    { icon: BarChart3, label: 'Market Cap', value: token.marketCap, color: 'text-purple-400' },
  ];

  return (
    <div className="border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-lg">
              {token.symbol.slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold group-hover:text-yellow-400 transition-colors">
              {token.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 font-mono text-sm">${token.symbol}</span>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-500">{token.createdAt}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/token/${token.address}`}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="View Details"
          >
            <ExternalLink size={18} className="text-gray-400 hover:text-yellow-400" />
          </Link>
          <button
            onClick={copyAddress}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Copy Address"
          >
            {copied ? (
              <Check size={18} className="text-green-400" />
            ) : (
              <Copy size={18} className="text-gray-400 hover:text-yellow-400" />
            )}
          </button>
        </div>
      </div>

      {/* Price & Change */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-900 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 mb-1">Current Price</p>
          <p className="text-2xl font-bold">{token.price} ETH</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">24h Change</p>
          <p className={`text-lg font-bold ${
            token.isProfit ? 'text-green-400' : 'text-red-400'
          }`}>
            {token.priceChange}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="flex items-center justify-center mb-2">
              <stat.icon size={16} className={stat.color} />
            </div>
            <p className="text-sm font-bold mb-1">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div className="border-t border-gray-800 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Your Revenue</span>
          <span className="text-lg font-bold text-yellow-400">{token.revenue}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <Link
          to={`/token/${token.address}`}
          className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg text-center transition-all"
        >
          Manage
        </Link>
        <button className="px-6 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-all">
          Share
        </button>
      </div>
    </div>
  );
}
