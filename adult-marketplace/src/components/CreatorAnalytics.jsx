/**
 * CreatorAnalytics Component
 * Shows analytics data for token creators
 */

import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, 
  BarChart3, ArrowUpRight, ArrowDownRight, Eye 
} from 'lucide-react';
import { formatCompactNumber, formatCurrency } from '../utils/format';

export default function CreatorAnalytics({ tokens = [], timeRange = '7d' }) {
  const [selectedRange, setSelectedRange] = useState(timeRange);
  
  // Calculate aggregate stats from all creator tokens
  const aggregateStats = tokens.reduce((acc, token) => {
    return {
      totalVolume: acc.totalVolume + (parseFloat(token.volume24h?.replace(/[$,]/g, '')) || 0),
      totalHolders: acc.totalHolders + (token.holders || 0),
      totalMarketCap: acc.totalMarketCap + (parseFloat(token.marketCap?.replace(/[$,]/g, '')) || 0),
      avgPriceChange: acc.avgPriceChange + (parseFloat(token.priceChange) || 0),
    };
  }, { totalVolume: 0, totalHolders: 0, totalMarketCap: 0, avgPriceChange: 0 });

  if (tokens.length > 0) {
    aggregateStats.avgPriceChange /= tokens.length;
  }

  const metrics = [
    {
      label: 'Total Volume (24h)',
      value: formatCurrency(aggregateStats.totalVolume),
      change: '+15.3%',
      isPositive: true,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Total Holders',
      value: formatCompactNumber(aggregateStats.totalHolders),
      change: '+8.2%',
      isPositive: true,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Market Cap',
      value: formatCurrency(aggregateStats.totalMarketCap),
      change: aggregateStats.avgPriceChange >= 0 ? `+${aggregateStats.avgPriceChange.toFixed(1)}%` : `${aggregateStats.avgPriceChange.toFixed(1)}%`,
      isPositive: aggregateStats.avgPriceChange >= 0,
      icon: BarChart3,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Views (24h)',
      value: formatCompactNumber(Math.floor(Math.random() * 10000) + 1000),
      change: '+22.1%',
      isPositive: true,
      icon: Eye,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  const timeRanges = ['24h', '7d', '30d', 'All'];

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Analytics Overview</h3>
        
        {/* Time Range Selector */}
        <div className="flex gap-1 bg-dark-900 rounded-lg p-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                selectedRange === range
                  ? 'bg-primary-500 text-black'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-dark-900/50 rounded-lg p-4 border border-dark-700 hover:border-dark-600 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              <span className="text-gray-400 text-sm">{metric.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold text-white">{metric.value}</span>
              <span className={`flex items-center text-sm ${
                metric.isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {metric.isPositive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mini Chart Placeholder */}
      <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm">Volume Trend</span>
          <span className="text-green-400 text-sm flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            +24.5% vs last period
          </span>
        </div>
        
        {/* Simple bar chart visualization */}
        <div className="flex items-end gap-1 h-24">
          {Array.from({ length: 14 }, (_, i) => {
            const height = 30 + Math.random() * 70;
            const isToday = i === 13;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t transition-all ${
                  isToday ? 'bg-primary-500' : 'bg-dark-600 hover:bg-dark-500'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>14 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* No tokens message */}
      {tokens.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Create your first token to see analytics</p>
        </div>
      )}
    </div>
  );
}
