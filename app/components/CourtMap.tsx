'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Circle, GoogleMap, InfoWindow, Marker } from '@react-google-maps/api';
import { hintForGoogleMapsConsoleMessage } from '@/lib/googleMaps';
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
  isLoaded: boolean;
  loadError: Error | undefined;
  center: LatLng;
  zoom: number;
  courts: MapCourt[];
  userPosition: LatLng | null;
  radiusKm?: number | null;
  selectedCourt: MapCourt | null;
  onSelectCourt: (court: MapCourt | null) => void;
}

function MapErrorPanel({
  title,
  detail,
  origin,
}: {
  title: string;
  detail: string;
  origin?: string;
}) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 px-6 overflow-y-auto">
      <div className="max-w-lg text-left">
        <p className="text-red-700 font-semibold mb-2">{title}</p>
        <p className="text-sm text-gray-700 mb-3">{detail}</p>
        {origin && (
          <p className="text-xs text-gray-500 mb-3">
            Current site: <code className="bg-gray-100 px-1 rounded">{origin}</code>
            {' — '}this must be allowed in your key&apos;s HTTP referrer list.
          </p>
        )}
        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li>File must be <code className="bg-gray-100 px-1 rounded">.env.local</code> in the project root</li>
          <li>Variable: <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key</code> (no quotes needed)</li>
          <li>Restart <code className="bg-gray-100 px-1 rounded">npm run dev</code> after changing env</li>
          <li>Enable <strong>Maps JavaScript API</strong> (not only Geocoding)</li>
          <li>Key type: browser / HTTP referrer — add <code className="bg-gray-100 px-1 rounded">http://localhost:3000/*</code></li>
        </ul>
      </div>
    </div>
  );
}

export default function CourtMap({
  isLoaded,
  loadError,
  center,
  zoom,
  courts,
  userPosition,
  radiusKm,
  selectedCourt,
  onSelectCourt,
}: CourtMapProps) {
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    setOrigin(window.location.origin);

    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      setRuntimeError(
        'Google rejected this API key (gm_authFailure). Check billing, Maps JavaScript API is enabled, and referrer restrictions include this site.'
      );
    };

    const onWindowError = (event: ErrorEvent) => {
      const message = event.message ?? '';
      const hint = hintForGoogleMapsConsoleMessage(message);
      if (hint) setRuntimeError(hint);
    };

    window.addEventListener('error', onWindowError);

    return () => {
      window.gm_authFailure = previousAuthFailure;
      window.removeEventListener('error', onWindowError);
    };
  }, []);

  if (loadError) {
    const hint = hintForGoogleMapsConsoleMessage(loadError.message);
    return (
      <MapErrorPanel
        title="Failed to load the Google Maps script"
        detail={hint ?? loadError.message}
        origin={origin}
      />
    );
  }

  if (runtimeError) {
    return (
      <MapErrorPanel
        title="Google Maps could not load"
        detail={runtimeError}
        origin={origin}
      />
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

      {userPosition && radiusKm != null && radiusKm > 0 && (
        <Circle
          center={userPosition}
          radius={radiusKm * 1000}
          options={{
            fillColor: '#16a34a',
            fillOpacity: 0.12,
            strokeColor: '#15803d',
            strokeOpacity: 0.6,
            strokeWeight: 2,
            clickable: false,
          }}
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
