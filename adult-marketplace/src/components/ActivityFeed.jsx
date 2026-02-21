import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Coins, Users, Rocket, Loader2 } from 'lucide-react';
import { useRecentTrades } from '../hooks/useTokens';

export default function ActivityFeed({ tokenAddress, limit = 10 }) {
  const { data, isLoading } = useRecentTrades({ 
    tokenAddress, 
    limit 
  });

  const activities = data?.trades || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-yellow-400" size={24} />
      </div>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="text-green-500" size={20} />;
      case 'sell':
        return <TrendingDown className="text-red-500" size={20} />;
      case 'yield':
        return <Coins className="text-yellow-400" size={20} />;
      case 'create':
        return <Rocket className="text-blue-400" size={20} />;
      default:
        return <Users size={20} />;
    }
  };

  const getActivityText = (activity) => {
    const isBuy = activity.type === 'buy';
    return (
      <>
        <span className="font-semibold font-mono text-xs">
          {activity.user?.slice(0, 6)}...{activity.user?.slice(-4)}
        </span>
        {' '}{isBuy ? 'bought' : 'sold'}{' '}
        <span className={`font-semibold ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
          {activity.amount} {activity.token?.symbol}
        </span>
        {' for '}
        <span className="font-semibold">{activity.value}</span>
      </>
    );
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-4 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
        >
          <div className="flex-shrink-0 mt-1">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300 leading-relaxed">
              {getActivityText(activity)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
