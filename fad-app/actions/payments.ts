import { apiRequest } from '@/lib/api';
import { Payment } from '@/types';

export async function getPayments(token: string): Promise<Payment[]> {
  return apiRequest('/payment/my', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function requestPayment(token: string, payment_method: string, payment_identifier?: string) {
  return apiRequest('/payment', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payment_method, payment_identifier }),
  });
}
