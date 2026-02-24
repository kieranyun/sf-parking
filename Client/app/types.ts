import { Coordinates } from 'expo-maps';

// Shared types — source of truth is SF-Parking-App/shared/types.ts
export type {
  ParkingRestriction,
  ParkingSpot,
  SweepingSchedule,
  NextSweep,
  ParkedLocationResponse,
  RestrictionsApiResponse,
} from '@shared/types';

// Client-only type (uses expo-maps Coordinates)
export interface SidewalkLine {
  type: 'LineString';
  coordinates: Coordinates[];
}
