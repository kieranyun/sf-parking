import { Coordinates } from 'expo-maps';


export interface ParkingRestriction {
  parkingSpot: ParkingSpot;
  sweepSchedule: SweepingSchedule;
}

export interface ParkingSpot {
  street: string;
  crossStreets: string; //cross streets
  blockside: string; //"East", "West", etc..
  cnn: number;
  sidewalkLine: any;
}
export interface SidewalkLine {
  type: 'LineString';
  coordinates: Coordinates[];
}

export interface RestrictionsApiResponse {
  checkedAt: string;
  latitude: number;
  longitude: number;
  restrictions: ParkingRestriction[];
}
// TODO: Add database row types
// export interface StreetSweepingRow {
//   id: number;
//   corridor?: string;
//   streetname?: string;
//   weekday?: string;
//   fromhour?: string;
//   tohour?: string;
//   // Add more fields as needed
// }

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
  date: string;       // ISO string
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