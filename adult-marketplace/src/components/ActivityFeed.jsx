import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Coins, Users, Rocket } from 'lucide-react';

export default function ActivityFeed({ tokenAddress, limit = 10 }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const mockActivities = [
      {
        id: 1,
        type: 'buy',
        user: '0x1234...5678',
        token: { name: 'Angola Rising', symbol: 'AGR', address: '0xABC' },
        amount: '1,250',
        value: '0.125 ETH',
        timestamp: '2 minutes ago'
      },
      {
        id: 2,
        type: 'sell',
        user: '0x2345...6789',
        token: { name: 'Luanda Tech', symbol: 'LTH', address: '0xDEF' },
        amount: '500',
        value: '0.075 ETH',
        timestamp: '5 minutes ago'
      },
      {
        id: 3,
        type: 'yield',
        user: '0x3456...7890',
        token: { name: 'Angola Rising', symbol: 'AGR', address: '0xABC' },
        amount: '0.0123 ETH',
        timestamp: '12 minutes ago'
      },
      {
        id: 4,
        type: 'create',
        user: '0x4567...8901',
        token: { name: 'Kizomba Coin', symbol: 'KIZ', address: '0xGHI' },
        timestamp: '1 hour ago'
      }
    ];

    const filteredActivities = tokenAddress
      ? mockActivities.filter(a => a.token.address === tokenAddress)
      : mockActivities;

    setActivities(filteredActivities.slice(0, limit));
  }, [tokenAddress, limit]);

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
    switch (activity.type) {
      case 'buy':
        return (
          <>
            <span className="font-semibold">{activity.user}</span>
            {' bought '}
            <span className="font-semibold text-green-500">{activity.amount} {activity.token.symbol}</span>
            {' for '}
            <span className="font-semibold">{activity.value}</span>
          </>
        );
      case 'sell':
        return (
          <>
            <span className="font-semibold">{activity.user}</span>
            {' sold '}
            <span className="font-semibold text-red-500">{activity.amount} {activity.token.symbol}</span>
            {' for '}
            <span className="font-semibold">{activity.value}</span>
          </>
        );
      case 'yield':
        return (
          <>
            <span className="font-semibold">{activity.user}</span>
            {' claimed '}
            <span className="font-semibold text-yellow-400">{activity.amount}</span>
            {' yield from '}
            <span className="font-semibold">{activity.token.symbol}</span>
          </>
        );
      case 'create':
        return (
          <>
            <span className="font-semibold">{activity.user}</span>
            {' launched '}
            <span className="font-semibold">{activity.token.name}</span>
          </>
        );
      default:
        return null;
    }
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
