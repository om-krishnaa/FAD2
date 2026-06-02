import { DollarSign, Eye, Moon, PlayCircle, Sun, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDashboardAnalytics } from '../actions/analytics';
import { useDarkMode } from '../contexts/ThemeContext';
import { DashboardStats } from '../types';
import Loader from './Loader';
import { useAuth } from '../contexts/AuthContext';

const rotatingWords = ['happening', 'growing', 'advancing', 'exciting'];

const Dashboard = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [analytics, setAnalytics] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const { darkMode, toggleDarkMode } = useDarkMode();
  const { accessToken, user } = useAuth();

  const stats = [
    {
      title: 'Total Users',
      value: analytics ? analytics.totalUsers : '-',
      icon: Users,
      bgColor: 'bg-blue-50 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
      hidden: user!.role !== 'super_admin',
    },
    {
      title: 'Active Ads',
      value: analytics ? analytics.activeAds : '-',
      icon: PlayCircle,
      bgColor: 'bg-green-50 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: user!.role === 'super_admin' ? 'Total Revenue' : 'Total Budget',
      value: analytics ? `Rs ${analytics.totalRevenue}` : '-',
      icon: DollarSign,
      bgColor: 'bg-purple-50 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Ad Views Today',
      value: analytics ? analytics.adViewsToday : '-',
      icon: Eye,
      bgColor: 'bg-orange-50 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = (await getDashboardAnalytics(
          accessToken
        )) as DashboardStats;
        if (!response) return;
        setAnalytics(response);
      } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [accessToken]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="relative min-h-screen p-8 transition-colors duration-300 bg-gray-50 dark:bg-gray-900">
      <button
        onClick={() => toggleDarkMode()}
        aria-label="Toggle Dark Mode"
        className={`fixed top-6 right-[40px] flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl border-2 transition-all duration-300 z-50 transform hover:scale-105 ${
          darkMode
            ? 'bg-gray-800 border-gray-600 text-yellow-400 shadow-yellow-400/20'
            : 'bg-white border-gray-300 text-gray-700 shadow-gray-400/30'
        }`}
        title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
      >
        {darkMode ? (
          <>
            <Sun
              className="w-6 h-6 animate-spin"
              style={{ animationDuration: '8s' }}
            />
            <span className="font-semibold text-yellow-400">Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-6 h-6 text-gray-700" />
            <span className="font-semibold text-gray-700">Dark Mode</span>
          </>
        )}
      </button>

      {/* Header with video and text */}
      <div className="flex flex-col gap-6 mb-8 md:flex-row md:items-center md:justify-between">
        {/* Video Player Box */}
        <div className="w-full overflow-hidden bg-black border border-gray-200 shadow-lg md:w-1/3 aspect-video rounded-xl dark:border-gray-700">
          <video controls className="object-cover w-full h-full">
            <source src="/hospital.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Header Text */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 transition-colors dark:text-white">
            Welcome back!
          </h1>
          <p className="font-semibold text-gray-600 transition-colors dark:text-gray-300">
            Here's what's{' '}
            <span className="inline-block px-2 py-1 text-white transition-all bg-blue-500 rounded animate-pulse">
              {rotatingWords[currentWordIndex]}
            </span>{' '}
            with FAD today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        className={`grid grid-cols-1 gap-6 mb-8 md:grid-cols-3 ${
          user!.role === 'super_admin' && 'lg:grid-cols-4'
        }`}
      >
        {stats.map((stat, index) => {
          if (stat.hidden) return null;
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="flex items-center p-6 space-x-4 transition-all duration-200 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700 hover:shadow-lg hover:transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 transition-colors dark:text-gray-400">
                  {stat.title}
                </p>
                <h3 className="mb-1 text-2xl font-bold text-gray-900 transition-colors dark:text-white whitespace-nowrap">
                  {stat.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div
        className={`grid grid-cols-1 gap-8 ${
          user!.role === 'super_admin' && 'lg:grid-cols-2'
        }`}
      >
        {/* Recent Ads Performance */}
        <div className="p-6 transition-colors bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 transition-colors dark:text-white">
              Recent Ad Performance
            </h2>
          </div>
          <div className="space-y-4">
            {analytics?.recentAds.map((ad) => (
              <div
                key={ad.id}
                className="p-4 transition-colors border border-gray-100 rounded-lg dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 transition-colors dark:text-white">
                    {ad.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      ad.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {ad.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 transition-colors dark:text-gray-300">
                  <div>
                    Views:{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {ad.actual_views || 0}
                    </span>
                  </div>
                  <div>
                    Budget:{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      Rs {ad.budget || 0}
                    </span>
                  </div>
                  <div>
                    Paid to Users:{' '}
                    <span className="font-medium text-gray-900 dark:text-white">
                      Rs {ad.spent_amount || 0}
                    </span>
                  </div>
                  <div>
                    Profit:{' '}
                    <span className="font-medium text-green-600 dark:text-green-400">
                      Rs {parseInt(ad.budget) - parseInt(ad.spent_amount) || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        {user!.role === 'super_admin' && (
          <div className="p-6 transition-colors bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
            <h2 className="mb-6 text-xl font-semibold text-gray-900 transition-colors dark:text-white">
              System Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 transition-colors border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/30 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-900 transition-colors dark:text-white">
                    Mobile App
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between p-3 transition-colors border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/30 dark:border-red-800">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Backend API
                  </span>
                </div>
                <span className="text-sm font-medium text-red-600">
                  Not Made
                </span>
              </div>
              <div className="flex items-center justify-between p-3 transition-colors border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/30 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-900 transition-colors dark:text-white">
                    Payment System
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between p-3 transition-colors border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-800">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-900 transition-colors dark:text-white">
                    Database
                  </span>
                </div>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  Maintenance
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Animation Styles */}
      <style>{`
        @keyframes floatUpEnhanced {
          0% { 
            transform: translateY(0) rotate(0deg) scale(1); 
          }
          25% { 
            transform: translateY(-8px) rotate(2deg) scale(1.02); 
          }
          50% { 
            transform: translateY(-15px) rotate(0deg) scale(1.05); 
          }
          75% { 
            transform: translateY(-8px) rotate(-2deg) scale(1.02); 
          }
          100% { 
            transform: translateY(0) rotate(0deg) scale(1); 
          }
        }
        .animate-floatUpEnhanced {
          animation: floatUpEnhanced 4s ease-in-out infinite;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
