import {
  Calendar,
  Eye,
  Filter,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  UserCheck,
  UserX,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getUserAnalytics } from '../actions/analytics';
import { blockUser, getUsers, updateUserRole } from '../actions/users';
import { useAuth } from '../contexts/AuthContext';
import { User, UserStats } from '../types';
import { formatDate } from '../utils';
import Loader from './Loader';
import BlockUserForm from './forms/BlockUser';
import ModalLayout from './layout/ModalLayout';

const UserView = ({
  isOpen,
  onClose,
  userData,
  accessToken,
  onRoleChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  userData?: User | null;
  accessToken: string;
  onRoleChange: (
    userId: number,
    role: 'user' | 'admin' | 'super_admin'
  ) => void;
}) => {
  if (!isOpen || !userData) return null;

  const [role, setRole] = useState<'user' | 'admin' | 'super_admin'>(
    userData.role as 'user' | 'admin' | 'super_admin'
  );
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <ModalLayout isOpen={isOpen} onClose={onClose} title="Transaction Details">
      <div onClick={(e) => e.stopPropagation()} className="p-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {userData.name}
            </h3>
            <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Mail className="w-4 h-4" /> {userData.email}
            </p>
            {userData.phone && (
              <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Phone className="w-4 h-4" /> {userData.phone}
              </p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              userData.status
            )}`}
          >
            {userData.status.charAt(0).toUpperCase() + userData.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Current Balance
            </p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              Rs {Number(userData.current_balance).toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Total Earned
            </p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              Rs {Number(userData.total_earned).toLocaleString()}
            </p>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            User Activity
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Ads Watched
              </span>
              <span className="font-medium">{userData.ads_watched_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Last Active
              </span>
              <span className="font-medium">
                {userData.last_active_at || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Registered
              </span>
              <span className="font-medium">
                {formatDate(userData.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Additional Details
          </h4>
          <div className="space-y-2 text-sm">
            {userData.location && (
              <p className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" /> {userData.location}
              </p>
            )}
            {userData.date_of_birth && (
              <p className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" /> {userData.date_of_birth}
              </p>
            )}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <label className="text-sm">Role:</label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'user' | 'admin' | 'super_admin')
                }
                disabled={saving || role === 'super_admin'}
                className="px-2 py-1 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
                {role === 'super_admin' && (
                  <option value="super_admin">super_admin</option>
                )}
              </select>
              {role !== 'super_admin' && (
                <button
                  disabled={saving || role === (userData.role as any)}
                  onClick={async () => {
                    try {
                      if (user?.role !== 'super_admin')
                        return toast.error(
                          'You are not authorized to update role'
                        );
                      setSaving(true);
                      const res = (await updateUserRole(
                        accessToken,
                        userData.id,
                        role as 'user' | 'admin'
                      )) as { success: boolean; message: string };
                      if (!res.success)
                        return toast.error(
                          res.message || 'Failed to update role'
                        );
                      toast.success(res.message || 'Role updated');
                      onRoleChange(userData.id, role);
                    } catch (e) {
                      toast.error('Failed to update role');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md disabled:bg-gray-500 hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalLayout>
  );
};

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [users, setUsers] = useState<User[] | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<UserStats | null>(null);
  const { accessToken, user } = useAuth();

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.phone?.includes(searchTerm);
    const matchesFilter =
      filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleBlockUser = (user: User) => {
    setSelectedUser(user);
    setShowBlockModal(true);
  };

  const handleSubmit = async ({
    reason,
    notes,
  }: {
    reason: string;
    notes?: string | null;
  }) => {
    const newBlockUserData = {
      reason,
      notes,
      status: 'blocked',
      blocked_by: user!.id.toString()!,
      is_permanent: false,
      unblock_date: null,
    };

    const res = (await blockUser(
      accessToken!,
      selectedUser?.id!,
      newBlockUserData
    )) as {
      success: boolean;
      message?: string;
    };
    if (!res.success) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    toast.success('Blocked successfully!');
    setSelectedUser(null);
    setUsers(
      users
        ? users.map((user) =>
            user && user.id === selectedUser?.id
              ? { ...user, status: 'blocked' }
              : user
          )
        : []
    );
  };

  useEffect(() => {
    if (!accessToken) return;

    const fetchUsers = async () => {
      try {
        const response = (await getUsers(accessToken)) as { data: User[] };
        if (!response) return;
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users.');
      }
    };
    fetchUsers();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = (await getUserAnalytics(accessToken)) as UserStats;
        if (!response) return;
        setAnalytics(response);
      } catch (error) {
        console.error('Error fetching user analytics:', error);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [accessToken]);

  if (loading) return <Loader />;
  return (
    <div className="p-8 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          User Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor and manage user accounts, balances, and activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
        {[
          {
            label: 'Total Users',
            value: analytics ? analytics.totalUsers : '-',
            icon: <UserCheck className="w-6 h-6 text-blue-600" />,
            bg: 'bg-blue-50 dark:bg-blue-900',
          },
          {
            label: 'Active Users',
            value: analytics ? analytics.activeUsers : '-',
            icon: <UserCheck className="w-6 h-6 text-green-600" />,
            bg: 'bg-green-50 dark:bg-green-900',
          },
          {
            label: 'Suspended',
            value: analytics ? analytics.suspendedUsers : '-',
            icon: <UserX className="w-6 h-6 text-red-600" />,
            bg: 'bg-red-50 dark:bg-red-900',
          },
          {
            label: 'Total Payouts',
            value: analytics ? analytics.totalPayouts : '-',
            icon: <Wallet className="w-6 h-6 text-purple-600" />,
            bg: 'bg-purple-50 dark:bg-purple-900',
          },
        ].map(({ label, value, icon, bg }) => (
          <div
            key={label}
            className={`p-6 bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {label}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    label === 'Active Users'
                      ? 'text-green-600 dark:text-green-400'
                      : label === 'Suspended'
                      ? 'text-red-600 dark:text-red-400'
                      : label === 'Total Payouts'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${bg}`}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="p-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 pl-10 pr-4 text-gray-900 bg-white border border-gray-300 rounded-lg w-80 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <tr>
                {[
                  'User',
                  'Contact',
                  'Balance',
                  'Total Earned',
                  'Ads Watched',
                  'Status',
                  'Last Active',
                  'Actions',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-4 font-semibold text-left text-gray-900 dark:text-gray-100"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers?.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                        <span className="text-sm font-medium text-white">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                          </span>
                          {user.is_verified && (
                            <Shield className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-900 dark:text-gray-100">
                        <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-900 dark:text-gray-100">
                          <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Rs {user.current_balance}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      Rs {user.total_earned}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 dark:text-gray-100">
                      {user.ads_watched_count}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status.charAt(0).toUpperCase() +
                        user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user.last_active_at ?? '--'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>{' '}
                      <button
                        disabled={user.role !== 'user'}
                        onClick={() => handleBlockUser(user)}
                        className={
                          'p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-800' +
                          (user.role !== 'user'
                            ? ' opacity-50 cursor-not-allowed'
                            : '')
                        }
                      >
                        <LockKeyhole className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserView
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedUser(null);
        }}
        userData={selectedUser}
        accessToken={accessToken!}
        onRoleChange={(userId, newRole) => {
          setUsers((prev) =>
            prev
              ? prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
              : prev
          );
          setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : prev));
        }}
      />

      <BlockUserForm
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Users;
