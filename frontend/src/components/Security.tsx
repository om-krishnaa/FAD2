import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Globe,
  Lock,
  Shield,
  Smartphone,
  UserX,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSettings, updateSecurity } from '../actions/settings';
import { changeUserStatus, getBlockedUsers } from '../actions/users';
import { useAuth } from '../contexts/AuthContext';
import { BlockedUser, SecuritySettingsState, SystemSettings } from '../types';
import { formatDate } from '../utils';

const Security = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[] | null>(null);

  const { accessToken } = useAuth();

  const [settings, setSettings] = useState<SecuritySettingsState>({
    daily_ad_limit: '20',
    min_view_duration: '15',
    ip_tracking_enabled: true,
    multiple_account_detection: true,
  });

  const handleNumberChange = (
    field: keyof SecuritySettingsState,
    value: number
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (
    field: keyof SecuritySettingsState,
    checked: boolean
  ) => {
    setSettings((prev) => ({ ...prev, [field]: checked }));
  };

  const handleSave = async () => {
    try {
      const res = (await updateSecurity(settings, accessToken!)) as {
        success: boolean;
        message?: string;
      };
      if (!res.success) {
        console.error('Error saving settings:', res.message);
        return;
      }
      toast.success(res?.message || 'Settings saved successfully!');
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  const handleUnblockUser = async (userId: number) => {
    try {
      const res = (await changeUserStatus(accessToken!, userId)) as {
        success: boolean;
        message?: string;
      };
      if (!res.success) {
        console.error('Error saving settings:', res.message);
        return;
      }
      blockedUsers &&
        setBlockedUsers((prev) =>
          (prev || []).filter((user) => user.id !== userId)
        );

      toast.success(res?.message || 'Settings saved successfully!');
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const securityMetrics = [
    {
      title: 'Daily View Limit',
      value: settings ? settings.daily_ad_limit + ' ads / day' : '-',
      status: 'active',
      description: 'Maximum ads per user per day',
      icon: Eye,
      color: 'blue',
    },
    {
      title: 'Min View Duration',
      value: settings ? settings.min_view_duration + ' seconds' : '-',
      status: 'active',
      description: 'Minimum viewing time required',
      icon: Clock,
      color: 'green',
    },
    {
      title: 'IP Tracking',
      value: settings.ip_tracking_enabled ? 'Enabled' : 'Disabled',
      status: 'active',
      description: 'Prevents fake users',
      icon: Globe,
      color: 'purple',
    },
    {
      title: '2FA for Admin',
      value: 'Required',
      status: 'active',
      description: 'Two-factor authentication',
      icon: Smartphone,
      color: 'orange',
    },
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Multiple accounts detected',
      description: 'User +91 9876543210 has 3 accounts from same IP',
      timestamp: '2 hours ago',
      status: 'pending',
    },
    {
      id: 2,
      type: 'error',
      title: 'Suspicious viewing pattern',
      description: 'User ID 12345 watched 25 ads in 10 minutes',
      timestamp: '4 hours ago',
      status: 'resolved',
    },
    {
      id: 3,
      type: 'info',
      title: 'New device login',
      description: 'Admin login from new device detected',
      timestamp: '1 day ago',
      status: 'resolved',
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
      case 'warning':
        return (
          <AlertTriangle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
        );
      case 'info':
        return (
          <CheckCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
        );
      default:
        return (
          <CheckCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    const fetchSettings = async () => {
      try {
        const response = (await getSettings(accessToken)) as SystemSettings;
        if (!response) return;
        setSettings({
          daily_ad_limit: response.daily_ad_limit,
          min_view_duration: response.min_view_duration,
          ip_tracking_enabled:
            response.ip_tracking_enabled.toString() === '1' ? true : false,
          multiple_account_detection:
            response.multiple_account_detection.toString() === '1'
              ? true
              : false,
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const fetchBlockedUsers = async () => {
      try {
        const response = (await getBlockedUsers(accessToken)) as {
          data: BlockedUser[];
        };
        if (!response) return;
        setBlockedUsers(response.data);
      } catch (error) {
        console.error('Error fetching blocked users:', error);
      }
    };
    fetchBlockedUsers();
  }, [accessToken]);

  return (
    <div className="p-8 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Security & Anti-Fraud
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Monitor system security and prevent fraudulent activities
        </p>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {securityMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg bg-${metric.color}-50 dark:bg-${metric.color}-900`}
                >
                  <Icon
                    className={`w-6 h-6 text-${metric.color}-600 dark:text-${metric.color}-400`}
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Active
                  </span>
                </div>
              </div>
              <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                {metric.value}
              </h3>
              <p className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                {metric.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="mb-8 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex px-6 space-x-8">
            {[
              { id: 'overview', name: 'Security Overview', icon: Shield },
              { id: 'alerts', name: 'Security Alerts', icon: AlertTriangle },
              { id: 'blocked', name: 'Blocked Users', icon: UserX },
              { id: 'settings', name: 'Security Settings', icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    System Health
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          Anti-Fraud System
                        </span>
                      </div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Operational
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          IP Monitoring
                        </span>
                      </div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Enabled
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 space-x-3 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          2 users blocked today
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          For suspicious activity
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center p-3 space-x-3 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Activity className="w-5 h-5 text-green-500 dark:text-green-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          15 alerts resolved
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          In the last 24 hours
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center p-3 space-x-3 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Activity className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          3 pending reviews
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Require manual verification
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Security Alerts
                </h3>
                <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500">
                  Mark All as Read
                </button>
              </div>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start p-4 space-x-4 transition-colors border border-gray-200 rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {alert.title}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            alert.status
                          )}`}
                        >
                          {alert.status}
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {alert.timestamp}
                        </span>
                        <div className="flex space-x-2">
                          <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500">
                            View Details
                          </button>
                          {alert.status === 'pending' && (
                            <button className="text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-500">
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'blocked' && blockedUsers && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Blocked Users
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {blockedUsers.length} users blocked
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-left text-gray-900 dark:text-gray-100">
                        User
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-900 dark:text-gray-100">
                        Phone
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-900 dark:text-gray-100">
                        Reason
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-900 dark:text-gray-100">
                        Ads Watched
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-900 dark:text-gray-100">
                        Blocked Date
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-900 dark:text-gray-100">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  {blockedUsers.length > 0 ? (
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {blockedUsers.map((blockedDetail) => (
                        <tr
                          key={blockedDetail.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full dark:bg-red-900">
                                <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {blockedDetail.user.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                            {blockedDetail.user.phone}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {blockedDetail.reason}
                          </td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                            {blockedDetail.user.ads_watched_count}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {formatDate(blockedDetail.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleUnblockUser(blockedDetail.id)
                                }
                                className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-500"
                              >
                                Unblock
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ) : (
                    <>
                      {' '}
                      <tr>
                        <td
                          colSpan={8}
                          className="py-5 text-center text-gray-500 dark:text-gray-400"
                        >
                          Nothing found
                        </td>
                      </tr>
                    </>
                  )}
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Security Configuration
              </h3>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    View Limits
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg dark:border-gray-700">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          Daily Ad Limit
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Maximum ads per user per day
                        </div>
                      </div>
                      <input
                        type="number"
                        value={settings.daily_ad_limit}
                        onChange={(e) =>
                          handleNumberChange(
                            'daily_ad_limit',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-20 px-2 py-1 text-center text-gray-900 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg dark:border-gray-700">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          Minimum View Duration
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Required viewing time in seconds
                        </div>
                      </div>
                      <input
                        type="number"
                        value={settings.min_view_duration}
                        onChange={(e) =>
                          handleNumberChange(
                            'min_view_duration',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-20 px-2 py-1 text-center text-gray-900 bg-white border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Security Features
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg dark:border-gray-700">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          IP Tracking
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Track user IP addresses
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.ip_tracking_enabled}
                          onChange={(e) =>
                            handleCheckboxChange(
                              'ip_tracking_enabled',
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg dark:border-gray-700">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          Multiple Account Detection
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Prevent multiple accounts from same device
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.multiple_account_detection}
                          onChange={(e) =>
                            handleCheckboxChange(
                              'multiple_account_detection',
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 space-x-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Security;
