import { apiRequest, API_URL } from '@/lib/api';
import { KeyMetrics, Report } from '@/types';

export const BACKEND_URL = API_URL.replace('/api', '');

export async function getReports(token: string): Promise<Report[]> {
  return apiRequest('/report/', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getReportAnalytics(
  token: string,
  timeframe: string
): Promise<KeyMetrics> {
  return apiRequest(`/analytics/report/${timeframe}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function generateReport(token: string, timeframe: string) {
  return apiRequest('/report', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ timeframe }),
  });
}

export async function generateUserReport(token: string) {
  return apiRequest('/report/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}

export async function generateFinanceReport(token: string, timeframe: string) {
  return apiRequest('/report/finance', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ timeframe }),
  });
}

export async function generateAdsReport(token: string, timeframe: string) {
  return apiRequest('/report/ads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ timeframe }),
  });
}