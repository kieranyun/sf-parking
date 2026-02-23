import { ParkingRestriction } from '@/app/types';
import { ApiError } from '@/services/api-client';
import getRestrictionsForPoint from '@/services/api-requests';
import { useEffect, useState } from 'react';

export function useRestrictionsForPoint(
  latitude: number,
  longitude: number,
  enabled: boolean = true
) {
  const [restrictions, setRestrictions] = useState<ParkingRestriction[]| null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [noResults, setNoResults] = useState(false);


  useEffect(() => {
    if (!enabled) return;
    if (latitude == null || longitude == null) return;

    const controller = new AbortController();

    const fetchRestrictions = async () => {
      setIsLoading(true);
      setError(null);
      setNoResults(false);

      try {
        const data = await getRestrictionsForPoint(
          latitude,
          longitude,
          controller.signal
        );
        setRestrictions(data.restrictions);
        setNoResults(data.restrictions.length === 0);
        console.log('API response:', data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err);
        }
        if (isApiError(err) && err.status === 404) {
          setRestrictions([]);
          setNoResults(true);
          return;
        }
        console.error('API error:', err);
        // AbortError is expected — ignore it
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestrictions();

    return () => {
      controller.abort();
    };
  }, [latitude, longitude, enabled]);

  return {
    restrictions,
    isLoading,
    error,
    noResults
  };
}

function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null && 'status' in err;
}