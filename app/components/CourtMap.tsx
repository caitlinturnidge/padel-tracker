'use client';

import Link from 'next/link';
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import { directionsUrl, type LatLng } from '@/lib/geo';

export interface MapCourt {
  id: string;
  name: string;
  description: string;
  available: boolean;
  lat: number;
  lng: number;
}

interface CourtMapProps {
  apiKey: string;
  center: LatLng;
  zoom: number;
  courts: MapCourt[];
  userPosition: LatLng | null;
  selectedCourt: MapCourt | null;
  onSelectCourt: (court: MapCourt | null) => void;
}

export default function CourtMap({
  apiKey,
  center,
  zoom,
  courts,
  userPosition,
  selectedCourt,
  onSelectCourt,
}: CourtMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 px-6 text-center">
        <p className="text-red-600">Failed to load Google Maps. Check your API key and enabled APIs.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-600" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={zoom}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {userPosition && (
        <Marker
          position={userPosition}
          title="Your location"
          label={{ text: 'You', color: '#ffffff', fontWeight: 'bold' }}
        />
      )}

      {courts.map((court) => (
        <Marker
          key={court.id}
          position={{ lat: court.lat, lng: court.lng }}
          onClick={() => onSelectCourt(court)}
        />
      ))}

      {selectedCourt && (
        <InfoWindow
          position={{ lat: selectedCourt.lat, lng: selectedCourt.lng }}
          onCloseClick={() => onSelectCourt(null)}
        >
          <div className="max-w-[220px]">
            <p className="font-semibold text-gray-900">{selectedCourt.name}</p>
            <p className="text-xs text-gray-600 mb-2">{selectedCourt.description}</p>
            <div className="flex flex-col gap-1">
              {selectedCourt.available ? (
                <Link
                  href={`/courts/${selectedCourt.id}`}
                  className="text-green-700 text-sm font-medium hover:text-green-800"
                >
                  View availability
                </Link>
              ) : (
                <span className="text-sm text-gray-500">Coming soon</span>
              )}
              <a
                href={directionsUrl(
                  { lat: selectedCourt.lat, lng: selectedCourt.lng },
                  userPosition ?? undefined
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 text-sm font-medium hover:text-blue-800"
              >
                Get directions
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
