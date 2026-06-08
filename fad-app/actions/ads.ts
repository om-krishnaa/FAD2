import { apiRequest } from '@/lib/api';
import { Ad, ViewAdType } from '@/types';

export async function getAdsList(token: string): Promise<Ad[]> {
  return apiRequest('/ads/', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getAds(token: string): Promise<Ad[]> {
  return apiRequest('/ads/available', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateAdStatus(
  id: number,
  status: string,
  token: string
) {
  return apiRequest(`/ads/${id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
}

export async function updateAdTransactionStatus(
  id: number,
  status: string,
  approved_by: number,
  token: string
) {
  return apiRequest(`/ads/${id}/transaction-status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, approved_by }),
  });
}

export async function deleteAds(id: number, token: string) {
  return apiRequest(`/ads/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createViewAd(viewAd: ViewAdType, token: string) {
  return apiRequest('/ads/view', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(viewAd),
  });
}
export async function createAds(formData: FormData, token: string) {
  return apiRequest('/ads/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}

export async function updateAds(id: number, formData: FormData, token: string) {
  return apiRequest(`/ads/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}