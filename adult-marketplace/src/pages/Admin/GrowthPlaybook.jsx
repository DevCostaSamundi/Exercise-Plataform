import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Zap, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * Growth Hacking Playbook
 * Database of tested growth tactics with AI recommendations
 */
export default function GrowthPlaybook() {
  const [loading, setLoading] = useState(true);
  const [playbook, setPlaybook] = useState(null);
  const [filter, setFilter] = useState('all'); // all, tested, untested

  useEffect(() => {
    loadPlaybook();
  }, []);

  const loadPlaybook = async () => {
    try {
      const response = await fetch('/api/ai/growth-playbook', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load playbook');
      
      const data = await response.json();
      setPlaybook(data);
    } catch (error) {
      console.error('Error loading playbook:', error);
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

  const filteredTactics = playbook?.allTactics.filter(t => {
    if (filter === 'tested') return t.tested;
    if (filter === 'untested') return !t.tested;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* AI Recommendation */}
      {playbook?.aiRecommendation && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border-2 border-green-500">
          <div className="flex items-start gap-4">
            <div className="bg-green-500 rounded-full p-3">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                🎯 AI Recommended Action
              </h3>
              <p className="text-green-800 dark:text-green-200 mb-4">
                {playbook.aiRecommendation.reasoning}
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="font-semibold text-gray-900 dark:text-white mb-2">
                  Next Best Tactic: {playbook.aiRecommendation.topPick}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Expected impact: {playbook.aiRecommendation.expectedImpact}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Growth Tactics Library
          </h2>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All Tactics' },
              { id: 'tested', label: 'Tested' },
              { id: 'untested', label: 'Not Tested' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === f.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tactics Grid */}
        <div className="space-y-4">
          {filteredTactics.map((tactic, idx) => (
            <TacticCard key={idx} tactic={tactic} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TacticCard({ tactic }) {
  const effortColors = {
    EASY: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HARD: 'bg-red-100 text-red-700'
  };

  const impactColors = {
    LOW: 'bg-gray-100 text-gray-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-purple-100 text-purple-700'
  };

  return (
    <div className={`rounded-lg p-6 border-2 ${
      tactic.tested 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {tactic.name}
            </h3>
            {tactic.tested && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                <CheckCircle className="w-3 h-3" />
                Tested
              </span>
            )}
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {tactic.description}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expected Impact</div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${impactColors[tactic.expectedGrowth]}`}>
            {tactic.expectedGrowth}
          </span>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Effort</div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${effortColors[tactic.effort]}`}>
            {tactic.effort}
          </span>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cost</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {tactic.cost}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expected Growth</div>
          <div className="text-lg font-semibold text-purple-600">
            {tactic.expectedGrowth}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex gap-3">
        {!tactic.tested ? (
          <>
            <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Implement This Tactic
            </button>
            <button className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              View Details
            </button>
          </>
        ) : (
          <div className="flex-1 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <div className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
              Results: +{tactic.actualGrowth} users
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">
              Tested on {new Date(tactic.testedDate).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
