import { apiRequest } from '@/lib/api';

export async function getSettings(token: string) {
  return apiRequest('/setting', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
