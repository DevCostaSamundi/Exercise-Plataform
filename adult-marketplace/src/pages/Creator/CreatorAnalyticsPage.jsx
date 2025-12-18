import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatorSidebar from '../../components/CreatorSidebar';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

export default function CreatorAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [analytics, setAnalytics] = useState({
    overview: {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      engagementRate: 0,
    },
    viewsChart: [],
    topContent: [],
    audienceDemographics: {
      ageGroups: [],
      topCountries: [],
      deviceTypes: [],
    },
    growth: {
      subscribers: 0,
      revenue: 0,
      engagement: 0,
    },
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/creator/analytics?timeRange=${timeRange}`);

      if (response.data?.data) {
        setAnalytics(response.data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar analytics:', err);
      setError(err.response?.data?.message || 'Erro ao carregar dados de analytics');

      // Mock data for development/demo
      setAnalytics({
        overview: {
          totalViews: 12450,
          totalLikes: 3240,
          totalComments: 856,
          totalShares: 421,
          engagementRate: 26.5,
        },
        viewsChart: [
          { date: '01/12', views: 420 },
          { date: '02/12', views: 520 },
          { date: '03/12', views: 380 },
          { date: '04/12', views: 650 },
          { date: '05/12', views: 590 },
          { date: '06/12', views: 720 },
        ],
        topContent: [
          { id: 1, title: 'Foto do Dia', views: 2340, likes: 456 },
          { id: 2, title: 'Vídeo Premium', views: 1890, likes: 389 },
          { id: 3, title: 'Behind the Scenes', views: 1560, likes: 312 },
        ],
        audienceDemographics: {
          ageGroups: [
            { range: '18-24', percentage: 35 },
            { range: '25-34', percentage: 45 },
            { range: '35-44', percentage: 15 },
            { range: '45+', percentage: 5 },
          ],
          topCountries: [
            { country: 'Brasil', percentage: 60 },
            { country: 'Portugal', percentage: 20 },
            { country: 'Estados Unidos', percentage: 12 },
            { country: 'Outros', percentage: 8 },
          ],
          deviceTypes: [
            { type: 'Mobile', percentage: 68 },
            { type: 'Desktop', percentage: 25 },
            { type: 'Tablet', percentage: 7 },
          ],
        },
        growth: {
          subscribers: 12.5,
          revenue: 18.3,
          engagement: 8.7,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <CreatorSidebar />
        <div className="flex-1">
          <LoadingSpinner size="lg" message="Carregando analytics..." />
        </div>
      </div>
    );
  }

  if (error && !analytics.overview.totalViews) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <CreatorSidebar />
        <div className="flex-1">
          <ErrorMessage
            message={error}
            onRetry={fetchAnalytics}
            title="Erro ao Carregar Analytics"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <CreatorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link to="/creator/dashboard" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-xl">P</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Analytics</span>
                </Link>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="7days">Últimos 7 dias</option>
                  <option value="30days">Últimos 30 dias</option>
                  <option value="90days">Últimos 90 dias</option>
                  <option value="1year">Último ano</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Error Warning */}
            {error && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium">
                    Dados de demonstração - API não conectada
                  </p>
                </div>
              </div>
            )}

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total de Visualizações"
                value={analytics.overview.totalViews.toLocaleString()}
                icon="👁️"
                trend={`+${analytics.growth.subscribers}%`}
                trendUp={true}
              />
              <StatCard
                title="Curtidas"
                value={analytics.overview.totalLikes.toLocaleString()}
                icon="❤️"
                trend={`+${analytics.growth.engagement}%`}
                trendUp={true}
              />
              <StatCard
                title="Comentários"
                value={analytics.overview.totalComments.toLocaleString()}
                icon="💬"
                trend="+5.2%"
                trendUp={true}
              />
              <StatCard
                title="Taxa de Engajamento"
                value={`${analytics.overview.engagementRate}%`}
                icon="📊"
                trend={`+${analytics.growth.engagement}%`}
                trendUp={true}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Views Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Visualizações
                </h3>
                <div className="space-y-3">
                  {analytics.viewsChart.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 dark:text-slate-400 w-16">
                        {item.date}
                      </span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${(item.views / 720) * 100}%` }}
                        >
                          <span className="text-xs font-bold text-white">
                            {item.views}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Content */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Conteúdo Mais Popular
                </h3>
                <div className="space-y-4">
                  {analytics.topContent.map((content, index) => (
                    <div
                      key={content.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-sm">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {content.title}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {content.views.toLocaleString()} views • {content.likes} likes
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Age Groups */}
              <DemographicCard
                title="Faixa Etária"
                icon="👥"
                data={analytics.audienceDemographics.ageGroups}
                labelKey="range"
              />

              {/* Countries */}
              <DemographicCard
                title="Principais Países"
                icon="🌍"
                data={analytics.audienceDemographics.topCountries}
                labelKey="country"
              />

              {/* Devices */}
              <DemographicCard
                title="Dispositivos"
                icon="📱"
                data={analytics.audienceDemographics.deviceTypes}
                labelKey="type"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, trend, trendUp }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span
          className={`text-sm font-semibold ${trendUp
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
            }`}
        >
          {trend}
        </span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

// Demographic Card Component
function DemographicCard({ title, icon, data, labelKey }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-700 dark:text-slate-300">{item[labelKey]}</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {item.percentage}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
