/**
 * Shared types between Client and Backend.
 *
 * IMPORTANT: This file is the source of truth.
 * The backend mirrors these in Backend/backend/src/types/index.ts.
 * If you update types here, make sure to sync the backend types manually.
 */

export interface ParkingRestriction {
  parkingSpot: ParkingSpot;
  sweepSchedule: SweepingSchedule;
  nextSweep?: NextSweep | null;
}

export interface ParkingSpot {
  street: string;
  crossStreets: string; // cross streets
  blockside: string;    // "East", "West", etc.
  cnn: number;
  sidewalkLine: any;
}

export interface SweepingSchedule {
  weekday: string;  // "Tuesday"
  fromHour: number;
  toHour: number;
  week1: boolean;
  week2: boolean;
  week3: boolean;
  week4: boolean;
  week5: boolean;
}

export interface NextSweep {
  date: string;      // ISO string
  street: string;
  blockside: string;
  fromHour: number;
}

export interface ParkedLocationResponse {
  deviceId: string;
  isParked: boolean;
  latitude?: number;
  longitude?: number;
  parkedAt?: string;
  restrictions?: ParkingRestriction[];
  nextSweep?: NextSweep | null;
}

export interface RestrictionsApiResponse {
  checkedAt: string;
  latitude: number;
  longitude: number;
  restrictions: ParkingRestriction[];
}
