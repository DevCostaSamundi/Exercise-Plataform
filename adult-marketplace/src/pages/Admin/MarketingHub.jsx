import { useState, useEffect } from 'react';
import { 
  Sparkles, TrendingUp, Target, Users, Clock, 
  BarChart3, AlertCircle, Zap, Trophy, Eye 
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import TokenLaunchAdvisor from './TokenLaunchAdvisor';
import GrowthPlaybook from './GrowthPlaybook';

/**
 * AI Marketing Hub - Strategic Command Center
 * Admin-only dashboard for AI-powered marketing intelligence
 */
export default function MarketingHub() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/ai/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load dashboard');
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-3xl font-bold">AI Marketing Hub</h1>
          </div>
          <p className="text-purple-100">
            Strategic intelligence for platform growth
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'strategy', label: 'Marketing Strategy', icon: Target },
              { id: 'tokens', label: 'Token Launch', icon: Zap },
              { id: 'growth', label: 'Growth Tactics', icon: TrendingUp },
              { id: 'sentiment', label: 'Sentiment', icon: Eye },
              { id: 'competitors', label: 'Competitors', icon: Trophy }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
        {activeTab === 'strategy' && <StrategyTab data={dashboardData?.marketingStrategy} />}
        {activeTab === 'tokens' && <TokenLaunchAdvisor />}
        {activeTab === 'growth' && <GrowthPlaybook />}
        {activeTab === 'sentiment' && <SentimentTab data={dashboardData?.sentiment} />}
        {activeTab === 'competitors' && <CompetitorsTab data={dashboardData?.competitors} />}
      </div>
    </div>
  );
}

/**
 * Overview Tab - Quick snapshot of all AI insights
 */
function OverviewTab({ data }) {
  if (!data) return <LoadingSpinner />;

  const { marketingStrategy, sentiment, timing, competitors } = data;

  return (
    <div className="space-y-6">
      {/* Action Alert */}
      {marketingStrategy?.shouldPostNow && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-green-500 rounded-full p-3">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                🚨 POST NOW - High Engagement Window!
              </h3>
              <p className="text-green-800 dark:text-green-200 mb-4">
                {marketingStrategy.reasoning}
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <p className="text-gray-900 dark:text-gray-100 mb-3">
                  {marketingStrategy.post}
                </p>
                <button 
                  onClick={() => navigator.clipboard.writeText(marketingStrategy.post)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sentiment Score */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Sentiment</span>
            <Eye className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {sentiment?.overall.score}/10
          </div>
          <div className="text-sm text-green-600 mt-1">
            {sentiment?.overall.trend} • {sentiment?.overall.mentions24h} mentions
          </div>
        </div>

        {/* Engagement Score */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Engagement</span>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {timing?.currentScore}/10
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {timing?.shouldPostNow ? 'Post now!' : `Wait until ${timing?.bestAlternativeTime}`}
          </div>
        </div>

        {/* Platform Volume */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">24h Volume</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ${marketingStrategy?.metrics.totalVolume.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {marketingStrategy?.metrics.newTokens || 0} new tokens
          </div>
        </div>

        {/* Competitor Gap */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">vs Pump.fun</span>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {competitors?.yourPosition.volume || 'N/A'}
          </div>
          <div className="text-sm text-orange-600 mt-1">
            Growing...
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Opportunity */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Top Growth Opportunity
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Based on AI analysis, here's your highest-impact action:
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="font-semibold text-gray-900 dark:text-white mb-2">
              Launch Gaming Token
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Gaming tokens have 60% more volume this week. Launch "ANGPLAY" targeting play-to-earn community.
            </div>
            <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              View Full Strategy
            </button>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Alerts & Issues
          </h3>
          <div className="space-y-3">
            {sentiment?.topComplaints.map((complaint, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {complaint.issue}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {complaint.mentions} mentions
                  </div>
                </div>
              </div>
            ))}
            {(!sentiment?.topComplaints || sentiment.topComplaints.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                No issues detected! 🎉
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Strategy Tab - Detailed marketing strategy
 */
function StrategyTab({ data }) {
  if (!data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Current Marketing Strategy
        </h2>

        {/* Generated Post */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Suggested Post
          </h3>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-700">
            <p className="text-lg text-gray-900 dark:text-white mb-4">
              "{data.post}"
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigator.clipboard.writeText(data.post)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy Post
              </button>
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(data.post)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Post to Twitter
              </a>
            </div>
          </div>
        </div>

        {/* Strategy Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Why This Strategy?
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300">
                {data.reasoning}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Key Metrics
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Highlight:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {data.highlightMetric}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">CTA:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {data.cta}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Post Now:</span>
                <span className={`font-semibold ${data.shouldPostNow ? 'text-green-600' : 'text-orange-600'}`}>
                  {data.shouldPostNow ? 'YES ✓' : `Wait until ${data.bestTimeToPost}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Remove placeholders TokenLaunchTab e GrowthTab
// (agora são componentes separados importados)

/**
 * Sentiment Tab - Detailed sentiment analysis
 */
function SentimentTab({ data }) {
  if (!data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Sentiment Analysis
        </h2>

        {/* Overall Score */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl font-bold text-gray-900 dark:text-white">
              {data.overall.score}/10
            </div>
            <div>
              <div className={`text-2xl font-semibold ${
                data.overall.sentiment === 'POSITIVE' ? 'text-green-600' : 
                data.overall.sentiment === 'NEGATIVE' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {data.overall.sentiment}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {data.overall.mentions24h} mentions in 24h
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{data.breakdown.positive}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Positive</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-600">{data.breakdown.neutral}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Neutral</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{data.breakdown.negative}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Negative</div>
            </div>
          </div>
        </div>

        {/* Evangelists */}
        {data.evangelists && data.evangelists.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Top Supporters
            </h3>
            <div className="space-y-2">
              {data.evangelists.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {user.username}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {user.followers.toLocaleString()} followers
                    </div>
                  </div>
                  <div className="text-green-600 font-semibold">
                    {user.tweets} tweets
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Competitors Tab - Competitor analysis
 */
function CompetitorsTab({ data }) {
  if (!data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Competitor Analysis
        </h2>

        {/* Your Position */}
        <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Position
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.yourPosition.volume}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Unique Advantages: </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.yourPosition.uniqueAdvantages.map((adv, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                    {adv}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Suggested Messaging:
              </div>
              <div className="text-gray-900 dark:text-white">
                "{data.yourPosition.suggestedMessaging}"
              </div>
            </div>
          </div>
        </div>

        {/* Competitors */}
        <div className="space-y-4">
          {data.competitors.map((competitor, idx) => (
            <div key={idx} className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  {competitor.name}
                </h4>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  competitor.threat === 'HIGH' ? 'bg-red-100 text-red-700' :
                  competitor.threat === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {competitor.threat} Threat
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Daily Volume</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    ${competitor.dailyVolume.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">New Tokens (24h)</div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {competitor.newTokens24h}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Top Feature: </span>
                  <span className="text-gray-900 dark:text-white">{competitor.topFeature}</span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    Opportunity:
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {competitor.opportunity}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
