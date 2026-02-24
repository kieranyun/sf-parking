import { ParkingRestriction } from '@/app/types';
import { useParking } from '@/contexts/ParkingContext';
import { useRestrictionsForPoint } from '@/hooks/useRestrictionsForPoint';
import { AppleMaps, Coordinates } from 'expo-maps';
import { AppleMapsPolyline } from 'expo-maps/build/apple/AppleMaps.types';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import RestrictionSheet from './bottom-sheet';
import Toast from './toast';


const SF_DEFAULT = { latitude: 37.7848, longitude: -122.4628 };

export default function MapComponent() {
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedRestriction, setSelectedRestriction] = useState<ParkingRestriction | null>(null);
  const [manualCoords, setManualCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const ignoreNextMapClickRef = useRef(false);

  // Parking context — auto-populated when the car parks via push notification or on app startup
  const { isParked, parkedLocation, restrictions: parkedRestrictions } = useParking();

  // When user taps the map, fetch restrictions for that point manually
  const { restrictions: manualRestrictions, isLoading, error, noResults } = useRestrictionsForPoint(
    manualCoords?.latitude ?? 0,
    manualCoords?.longitude ?? 0,
    manualCoords !== null // only fetch when user has tapped
  );

  // Decide which restrictions to show: parked car's or manual tap
  const activeRestrictions = manualCoords ? manualRestrictions : parkedRestrictions;

  useEffect(() => {
    if (noResults) {
      setToastVisible(true);
    }
  }, [noResults]);

  // Camera center: manual tap > parked location > SF default
  const cameraCenter = manualCoords ?? parkedLocation ?? SF_DEFAULT;

  // Markers
  const markers = useMemo(() => {
    const m = [];

    // Always show parked car if parked
    if (isParked && parkedLocation) {
      m.push({
        coordinates: parkedLocation,
        title: 'Parked Car',
        tintColor: 'green',
        id: 'ParkedCar'
      });
    }

    // Show manual tap marker if user has tapped somewhere different
    if (manualCoords) {
      m.push({
        coordinates: manualCoords,
        title: 'Checked Location',
        tintColor: 'blue',
        id: 'ManualCoords'
      });
    }

    return m;
  }, [isParked, parkedLocation, manualCoords]);

  // Polylines
  const restrictionLines = useMemo(() => {
    if (!activeRestrictions) return [];
    return activeRestrictions
      .filter(r => r.parkingSpot?.sidewalkLine?.coordinates)
      .map((r) => {
        const restrictionID = `restriction-${r.parkingSpot.cnn}-${r.parkingSpot.blockside}`;
        return {
          id: restrictionID,
          coordinates: coordinateConverter(r.parkingSpot.sidewalkLine.coordinates),
          color: selectedLineId === restrictionID ? 'orange' : 'red',
          width: selectedLineId === restrictionID ? 4 : 2,
        };
      });
  }, [activeRestrictions, selectedLineId]);

  /** Look up the ParkingRestriction that corresponds to a polyline id. */
  const findRestrictionByLineId = (lineId: string): ParkingRestriction | undefined => {
    return activeRestrictions?.find((r) => {
      const id = `restriction-${r.parkingSpot.cnn}-${r.parkingSpot.blockside}`;
      return id === lineId;
    });
  };

  // Function to handle map clicks
  const handleMapClick = (event: { coordinates: Coordinates }) => {
    if (ignoreNextMapClickRef.current === true) {
      ignoreNextMapClickRef.current = false;
      return;
    }
    const { latitude, longitude } = event.coordinates;
    if (latitude === undefined || longitude === undefined) return;

    // Dismiss selection
    setSelectedLineId(null);
    setSelectedRestriction(null);

    // Set manual coordinates to fetch restrictions for the tapped point
    setManualCoords({ latitude, longitude });
  };

  const handlePolylineClick = (line: AppleMapsPolyline): void => {
    if (line.id === undefined) return;
    ignoreNextMapClickRef.current = true;

    setSelectedLineId(line.id);
    setSelectedRestriction(findRestrictionByLineId(line.id) ?? null);
  };

  const handleMarkerClick = (marker: { id?: string }): void => {
    if (marker.id === 'ParkedCar' && parkedRestrictions && parkedRestrictions.length > 0) {
      ignoreNextMapClickRef.current = true;
      setManualCoords(null);
      const closest = parkedRestrictions[0];
      const lineId = `restriction-${closest.parkingSpot.cnn}-${closest.parkingSpot.blockside}`;
      setSelectedLineId(lineId);
      setSelectedRestriction(closest);
    }
  }

  return (
    <View>
      <AppleMaps.View
        style={styles.map}
        cameraPosition={{ coordinates: cameraCenter, zoom: 16 }}
        markers={markers}
        polylines={restrictionLines}
        onMapClick={handleMapClick}
        onPolylineClick={handlePolylineClick}
        onMarkerClick={handleMarkerClick}
      />

      {/* Next sweep warning banner — uses nextSweep from the closest restriction */}
      {isParked && parkedRestrictions?.[0]?.nextSweep && !manualCoords && (
        <View style={styles.sweepBanner}>
          <Text style={styles.sweepBannerText}>
            Next sweep: {parkedRestrictions[0].nextSweep.street} ({parkedRestrictions[0].nextSweep.blockside}) — {new Date(parkedRestrictions[0].nextSweep.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {parkedRestrictions[0].nextSweep.fromHour}:00
          </Text>
        </View>
      )}

      {/* Button to go back to parked car view when viewing manual location */}
      {manualCoords && isParked && (
        <View style={styles.backToCarButton}>
          <Text
            style={styles.backToCarText}
            onPress={() => setManualCoords(null)}
          >
            ← Back to parked car
          </Text>
        </View>
      )}

      <Toast
        message="No restrictions found for this area"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading restrictions...</Text>
        </View>
      )}
      <RestrictionSheet
        restriction={selectedRestriction}
        nextSweep={!manualCoords ? (selectedRestriction?.nextSweep ?? null) : null}
        isOpened={selectedRestriction !== null}
        onDismiss={() => {
          setSelectedRestriction(null);
          setSelectedLineId(null);
        }}
      />
    </View>
  );
}


const coordinateConverter = (raw: [number, number][]): Coordinates[] =>
  raw.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  sweepBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(220, 50, 50, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  sweepBannerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  backToCarButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  backToCarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
