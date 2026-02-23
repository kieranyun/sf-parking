// Type definitions for the SF Parking App

// TODO: Define request/response types
export interface CheckParkingRequest {
  latitude: number;
  longitude: number;
}

export interface CheckParkingResponse {
  latitude: number;
  longitude: number;
  restrictions: ParkingRestriction[];
  parkingAllowed: boolean;
  checkedAt: string;
  dataLastUpdated?: string;
}

//To be updated
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

// TODO: Add GeoJSON types if needed
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
  properties: FeatureProperties;
}

export interface FeatureProperties {
  corridor: string;
  week3: string;
  week5: string;
  cnnrightleft: string;
  cnn: string;
  week2: string;
  holidays: string;
  fullname: string;
  blockside: string;
  week1: string;
  fromhour: string;
  weekday: string;
  tohour: string;
  blocksweepid: string;
  week4: string;
  limits: string;
}