import { TrendingUp, Users, Award, Calendar } from 'lucide-react';

export default function CreatorStats({ stats }) {
  const metrics = [
    {
      icon: TrendingUp,
      label: 'Total Volume',
      value: stats.totalVolume || '$0',
      change: '+15.3%',
      isPositive: true,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      icon: Users,
      label: 'Total Holders',
      value: stats.totalHolders || '0',
      change: '+23',
      isPositive: true,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    {
      icon: Award,
      label: 'Creator Rating',
      value: stats.rating ? `${stats.rating.toFixed(1)}⭐` : 'No ratings',
      change: stats.rating ? '' : 'Be the first!',
      isPositive: true,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    },
    {
      icon: Calendar,
      label: 'Tokens Created',
      value: stats.totalTokens || '0',
      change: 'All time',
      isPositive: true,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={metric.color} size={24} />
            </div>
            {metric.change && (
              <span className={`text-xs font-semibold ${
                metric.isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {metric.change}
              </span>
            )}
          </div>
          
          <h3 className="text-2xl font-bold mb-1">{metric.value}</h3>
          <p className="text-sm text-gray-500">{metric.label}</p>
        </div>
      ))}
    </div>
  );
}
