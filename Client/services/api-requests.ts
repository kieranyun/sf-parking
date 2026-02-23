import { RestrictionsApiResponse } from '@/app/types';
import apiFetch from './api-client';

export default function getRestrictionsForPoint(latitude: number, longitude: number, signal: AbortSignal) {
  return apiFetch<RestrictionsApiResponse>(`/api/check-parking`, {
    body: JSON.stringify({latitude, longitude}),
    method: 'POST',
    signal,
  });
}