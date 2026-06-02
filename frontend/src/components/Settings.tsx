import {
  Bell,
  Database,
  Settings as SettingsIcon,
  Shield,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getNotificationPreferences, getSettings } from '../actions/settings';
import { getUser } from '../actions/users';
import { useAuth } from '../contexts/AuthContext';
import {
  Notification as NotificationType,
  SystemSettings,
  User as UserType,
} from '../types';
import Loader from './Loader';
import General from './settings/General';
import Notification from './settings/Notification';
import Profile from './settings/Profile';
import Security from './settings/Security';
import System from './settings/System';

const settingsTabs = [
  { id: 'general', name: 'General', icon: SettingsIcon },
  { id: 'profile', name: 'Admin Profile', icon: User },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'system', name: 'System', icon: Database },
  { id: 'security', name: 'Security', icon: Shield },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [notificationState, setNotificationState] =
    useState<NotificationType | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const settingResponse = (await getSettings(
          accessToken
        )) as SystemSettings;
        const notificationResponse = (await getNotificationPreferences(
          accessToken
        )) as NotificationType;
        const userResponse = (await getUser(accessToken)) as UserType;
        if (!settingResponse || !notificationResponse || !userResponse) return;
        setSettings(settingResponse);
        setNotificationState(notificationResponse);
        setUser(userResponse);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [accessToken]);

  if (loading) return <Loader />;
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your admin dashboard preferences and system configuration
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Settings Navigation */}
        <div className="lg:w-64">
          <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
            <nav className="space-y-2">
              {settingsTabs.map((tab) => {
                if (
                  user?.role !== 'super_admin' &&
                  (tab.name === 'General' ||
                    tab.name === 'System' ||
                    tab.name === 'Security')
                ) {
                  return null;
                }

                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
            {/* General Tab */}
            {activeTab === 'general' && <General systemSettings={settings} />}

            {/* Admin Profile Tab */}
            {activeTab === 'profile' && <Profile user={user} />}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Notification notificationState={notificationState} />
            )}

            {/* System Tab */}
            {activeTab === 'system' && <System systemSettings={settings} />}

            {/* Security Tab */}
            {activeTab === 'security' && <Security systemSettings={settings} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
