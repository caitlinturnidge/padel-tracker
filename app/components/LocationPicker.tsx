'use client';

import { useState } from 'react';
import { lookupUkPostcode, type LatLng } from '@/lib/geo';

export interface UserLocation {
  position: LatLng;
  label: string;
}

interface LocationPickerProps {
  value: UserLocation | null;
  onChange: (location: UserLocation | null) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [postcodeInput, setPostcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePostcode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = postcodeInput.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    const result = await lookupUkPostcode(trimmed);
    if (!result) {
      setError('Postcode not found. Try again (e.g. BN1 4GW).');
      setLoading(false);
      return;
    }
    onChange({ position: result, label: trimmed.toUpperCase() });
    setLoading(false);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          label: 'Your location',
        });
        setLoading(false);
      },
      () => {
        setError('Could not get your location. Enter a postcode instead.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clear = () => {
    onChange(null);
    setPostcodeInput('');
    setError('');
  };

  return (
    <div>
      {value ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="text-sm text-gray-600">Starting from</p>
              <p className="font-semibold text-gray-900">{value.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            Change location
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handlePostcode} className="flex flex-1 gap-2">
              <input
                type="text"
                value={postcodeInput}
                onChange={(e) => setPostcodeInput(e.target.value)}
                placeholder="Enter UK postcode (e.g. BN1 4GW)"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                autoComplete="postal-code"
              />
              <button
                type="submit"
                disabled={loading || !postcodeInput.trim()}
                className="px-5 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-green-400"
              >
                Go
              </button>
            </form>
            <button
              type="button"
              onClick={handleGeolocation}
              disabled={loading}
              className="px-5 py-3 rounded-xl border-2 border-green-600 text-green-700 font-medium hover:bg-green-50 disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Locating…' : 'Use my location'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
