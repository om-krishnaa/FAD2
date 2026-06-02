import {
  Calendar,
  DollarSign,
  Download,
  Eye,
  PlayCircle,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAnalytics } from '../actions/analytics';
import { useAuth } from '../contexts/AuthContext';
import { Analytics as AnalyticsType } from '../types';
import Loader from './Loader';

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState(false);
  const { accessToken, user } = useAuth();

  const metrics = [
    {
      title: 'Total Ad Views',
      value: analytics ? analytics.stats.totalViews.toLocaleString() : '-',
      icon: Eye,
      color: 'blue',
    },
    {
      title: 'Active Users',
      value: analytics ? analytics.stats.activeUsers.toLocaleString() : '-',
      icon: Users,
      color: 'green',
    },
    {
      title: 'Revenue Generated',
      value: analytics
        ? 'Rs ' + analytics.stats.revenueGenerated.toLocaleString()
        : '-',
      icon: DollarSign,
      color: 'purple',
    },
    {
      title: 'Avg. CTR',
      value: analytics ? Number(analytics.stats.avgCTR).toFixed(2) + '%' : '-',
      icon: PlayCircle,
      color: 'orange',
    },
  ];

  const revenueBreakdown = [
    {
      value: analytics?.revenueBreakdown.revenueFromFacilities || 0,
      label: 'Revenue from Facilities',
      bg: 'bg-blue-50 dark:bg-blue-900',
      text: 'text-blue-600 dark:text-blue-400',
    },
    {
      value: analytics?.revenueBreakdown?.paidToUsers || 0,
      label: 'Paid to Users',
      bg: 'bg-green-50 dark:bg-green-900',
      text: 'text-green-600 dark:text-green-400',
    },
    {
      value: analytics?.revenueBreakdown?.netProfit || 0,
      label: 'Net Profit',
      bg: 'bg-purple-50 dark:bg-purple-900',
      text: 'text-purple-600 dark:text-purple-400',
    },
  ];

  useEffect(() => {
    if (!accessToken) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = (await getAnalytics(
          timeframe,
          accessToken
        )) as AnalyticsType;
        if (!response) return;
        setAnalytics(response);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeframe, accessToken]);

  if (loading) return <Loader />;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track performance metrics and user engagement
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1yr">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700"
            >
              <div className="flex items-center space-x-6">
                <div
                  className={`p-3 rounded-lg bg-${metric.color}-50 dark:bg-${metric.color}-900`}
                >
                  <Icon
                    className={`w-6 h-6 text-${metric.color}-600 dark:text-${metric.color}-400`}
                  />
                </div>
                <div>
                  <h3 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {metric.value}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {metric.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Engagement Chart */}
      <div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
        <div className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Weekly Engagement
          </h2>
          <div className="space-y-4">
            {analytics?.weeklyEngagement.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center w-20 space-x-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {data.day}
                  </span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{ width: `${(data.total_views / 5200) * 100}%` }}
                      ></div>
                    </div>
                    <span className="w-16 text-sm text-gray-600 dark:text-gray-300">
                      {data.total_views}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Users className="w-4 h-4" />
                  <span>{data.active_users}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Ads */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Top Performing Ads
          </h2>
          <div className="space-y-4">
            {analytics?.recentAds.map((ad, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ad.title}
                  </h3>
                  <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{ad.actual_views.toLocaleString()} views</span>
                    <span>CTR: {ad.click_through_rate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600 dark:text-green-400">
                    Rs {ad.budget.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Analytics */}
      {user!.role === 'super_admin' && (
        <div className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Revenue Breakdown
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>Last 30 days</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {revenueBreakdown.map((stat, idx) => (
              <div
                key={idx}
                className={`p-6 text-center rounded-lg ${stat.bg}`}
              >
                <div className={`mb-2 text-2xl font-bold ${stat.text}`}>
                  Rs {stat.value.toLocaleString('en-IN')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
