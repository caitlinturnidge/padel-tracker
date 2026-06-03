'use client';

import { useJsApiLoader } from '@react-google-maps/api';
import CourtMap, { type MapCourt } from '@/app/components/CourtMap';
import { getGoogleMapsApiKey } from '@/lib/googleMaps';
import type { LatLng } from '@/lib/geo';

interface CourtMapLoaderProps {
  center: LatLng;
  zoom: number;
  courts: MapCourt[];
  userPosition: LatLng | null;
  radiusKm?: number | null;
  selectedCourt: MapCourt | null;
  onSelectCourt: (court: MapCourt | null) => void;
}

export default function CourtMapLoader(props: CourtMapLoaderProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'court-tracker-google-map',
    googleMapsApiKey: getGoogleMapsApiKey(),
  });

  return (
    <CourtMap
      isLoaded={isLoaded}
      loadError={loadError}
      {...props}
    />
  );
}
