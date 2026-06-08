import { apiRequest } from '@/lib/api';
import { Referral } from '@/types';

export async function getMyReferrals(token: string): Promise<Referral[]> {
  return apiRequest('/referral', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}