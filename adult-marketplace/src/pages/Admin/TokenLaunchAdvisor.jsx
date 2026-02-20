import { useState, useEffect } from 'react';
import { Zap, TrendingUp, Users, DollarSign, Calendar, Target } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * Token Launch Advisor
 * AI-powered suggestions for launching tokens
 */
export default function TokenLaunchAdvisor() {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const response = await fetch('/api/ai/token-launch-advice', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load opportunities');
      
      const data = await response.json();
      setOpportunities(data.opportunities || []);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Token Launch Opportunities
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          AI-analyzed market gaps and trending topics for your next token launch
        </p>

        {opportunities.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading opportunities...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {opportunities.map((opp, idx) => (
              <OpportunityCard key={idx} opportunity={opp} rank={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity, rank }) {
  const potentialColors = {
    HIGH: 'bg-green-100 text-green-700 border-green-300',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    LOW: 'bg-gray-100 text-gray-700 border-gray-300'
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
            #{rank}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {opportunity.tokenName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {opportunity.category}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${potentialColors[opportunity.potential]}`}>
          {opportunity.potential} Potential
        </span>
      </div>

      {/* Token Concept */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Concept:
        </h4>
        <p className="text-gray-900 dark:text-white">
          {opportunity.description}
        </p>
      </div>

      {/* Why Now */}
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Why This Is Hot Right Now:
        </h4>
        <p className="text-gray-900 dark:text-white">
          {opportunity.whyNow}
        </p>
      </div>

      {/* Launch Strategy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Best Launch Time:
          </h4>
          <p className="text-gray-900 dark:text-white">
            {opportunity.bestLaunchDay} at {opportunity.bestLaunchTime}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Expected Volume:
          </h4>
          <p className="text-gray-900 dark:text-white font-semibold">
            {opportunity.expectedVolume}
          </p>
        </div>
      </div>

      {/* Marketing Strategy */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Marketing Strategy:
        </h4>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <ul className="space-y-2">
            {opportunity.marketingTactics.map((tactic, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span className="text-gray-900 dark:text-white">{tactic}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
          Launch This Token
        </button>
        <button className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Save for Later
        </button>
      </div>
    </div>
  );
}
