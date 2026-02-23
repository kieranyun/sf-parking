import { NextSweep, ParkingRestriction, ParkedLocationResponse } from '@/app/types';
import apiFetch from '@/services/api-client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Hardcoded for now — the MP91 IMEI
const DEVICE_ID = '7018523442';

interface ParkingState {
  isParked: boolean;
  parkedLocation: { latitude: number; longitude: number } | null;
  restrictions: ParkingRestriction[] | null;
  nextSweep: NextSweep | null;
  isLoading: boolean;
}

interface ParkingContextValue extends ParkingState {
  setParked: (data: {
    latitude: number;
    longitude: number;
    restrictions: ParkingRestriction[];
    nextSweep: NextSweep | null;
  }) => void;
  clearParked: () => void;
  refreshParkedStatus: () => Promise<void>;
}

const ParkingContext = createContext<ParkingContextValue | null>(null);

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ParkingState>({
    isParked: false,
    parkedLocation: null,
    restrictions: null,
    nextSweep: null,
    isLoading: true,
  });

  const setParked = useCallback((data: {
    latitude: number;
    longitude: number;
    restrictions: ParkingRestriction[];
    nextSweep: NextSweep | null;
  }) => {
    setState({
      isParked: true,
      parkedLocation: { latitude: data.latitude, longitude: data.longitude },
      restrictions: data.restrictions,
      nextSweep: data.nextSweep,
      isLoading: false,
    });
  }, []);

  const clearParked = useCallback(() => {
    setState({
      isParked: false,
      parkedLocation: null,
      restrictions: null,
      nextSweep: null,
      isLoading: false,
    });
  }, []);

  const refreshParkedStatus = useCallback(async () => {
    try {
      const data = await apiFetch<ParkedLocationResponse>(
        `/api/parked-location/${DEVICE_ID}`
      );

      if (data.isParked && data.latitude && data.longitude) {
        setState({
          isParked: true,
          parkedLocation: { latitude: data.latitude, longitude: data.longitude },
          restrictions: data.restrictions ?? null,
          nextSweep: data.nextSweep ?? null,
          isLoading: false,
        });
      } else {
        setState(prev => ({ ...prev, isParked: false, parkedLocation: null, restrictions: null, nextSweep: null, isLoading: false }));
      }
    } catch (error: any) {
      // 404 means device not tracked yet — that's fine
      if (error?.status === 404) {
        console.log('Device not found in parking DB yet');
      } else {
        console.error('Failed to fetch parked status:', error);
      }
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Hydrate on mount — fetch current parked status from backend
  useEffect(() => {
    refreshParkedStatus();
  }, [refreshParkedStatus]);

  return (
    <ParkingContext.Provider value={{ ...state, setParked, clearParked, refreshParkedStatus }}>
      {children}
    </ParkingContext.Provider>
  );
}

export function useParking(): ParkingContextValue {
  const ctx = useContext(ParkingContext);
  if (!ctx) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return ctx;
}
