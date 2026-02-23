import MapComponent from '@/components/map-view';

// import { AppleMaps } from 'expo-maps';
import React from 'react';

export default function Test2Screen() {
  //This will eventually be replaced by the API call to traccar server
  //   const [latitude, setLatitude] = useState('37.7848');
  // const [longitude, setLongitude] = useState('-122.4628');
  return (
    <MapComponent
    // latitude={parseFloat(latitude)}
    // longitude={parseFloat(longitude)}
    />
  )
}