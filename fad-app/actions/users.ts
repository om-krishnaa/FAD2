import { apiRequest } from '@/lib/api';
import { User } from '@/types';

export async function getUser(token: string): Promise<User> {
  return apiRequest('/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}