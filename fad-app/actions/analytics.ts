import { apiRequest } from '@/lib/api';
import { Analytics, DashboardStats } from '@/types';

export async function getDashboardAnalytics(token: string): Promise<DashboardStats> {
  return apiRequest('/analytics/dashboard', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAnalytics(
  timeframe: string,
  token: string
): Promise<Analytics> {
  return apiRequest(`/analytics/${timeframe}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}