'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo, useCallback } from 'react';
import CourtMapLoader from '@/app/components/CourtMapLoader';
import {
    distanceKm,
    formatDistance,
    lookupUkPostcode,
    type LatLng,
} from '@/lib/geo';
import { isGoogleMapsKeyConfigured } from '@/lib/googleMaps';
import { COURT_LOCATIONS, type CourtLocation } from '@/lib/locations';

const locations = COURT_LOCATIONS;
type Location = CourtLocation;

const CITY_CENTERS: Record<'brighton' | 'london', LatLng> = {
    brighton: { lat: 50.8309, lng: -0.1409 },
    london: { lat: 51.4890, lng: -0.1130 },
};

export default function LocationsPage() {
    const [mounted, setMounted] = useState(false);
    const [selectedCity, setSelectedCity] = useState<'brighton' | 'london'>('brighton');
    const [selectedMapLocation, setSelectedMapLocation] = useState<Location | null>(null);
    const [userPosition, setUserPosition] = useState<LatLng | null>(null);
    const [postcodeInput, setPostcodeInput] = useState('');
    const [locationLabel, setLocationLabel] = useState<string | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const mapsKeyConfigured = isGoogleMapsKeyConfigured();

    useEffect(() => {
        setMounted(true);
    }, []);

    const applyUserPosition = useCallback((position: LatLng, label: string) => {
        setUserPosition(position);
        setLocationLabel(label);
        setLocationError('');

        const nearest = [...locations].sort(
            (a, b) =>
                distanceKm(position, a) - distanceKm(position, b)
        )[0];
        if (nearest) {
            setSelectedCity(nearest.city);
        }
    }, []);

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported in this browser.');
            return;
        }

        setLocationLoading(true);
        setLocationError('');

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                applyUserPosition(
                    { lat: pos.coords.latitude, lng: pos.coords.longitude },
                    'Your current location'
                );
                setLocationLoading(false);
            },
            () => {
                setLocationError('Could not access your location. Try entering a postcode instead.');
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handlePostcodeSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = postcodeInput.trim();
        if (!trimmed) return;

        setLocationLoading(true);
        setLocationError('');

        const result = await lookupUkPostcode(trimmed);
        if (!result) {
            setLocationError('Postcode not found. Check the format and try again.');
            setLocationLoading(false);
            return;
        }

        applyUserPosition(result, trimmed.toUpperCase());
        setLocationLoading(false);
    };

    const clearUserLocation = () => {
        setUserPosition(null);
        setLocationLabel(null);
        setPostcodeInput('');
        setLocationError('');
    };

    const getTypeColor = (type: 'padel' | 'tennis') => {
        return type === 'padel'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-blue-100 text-blue-800 border-blue-200';
    };

    const selectedCityLocations = useMemo(() => {
        const filtered = locations.filter((location) => location.city === selectedCity);
        if (!userPosition) return filtered;

        return [...filtered].sort(
            (a, b) => distanceKm(userPosition, a) - distanceKm(userPosition, b)
        );
    }, [selectedCity, userPosition]);

    const mapCenter = userPosition ?? CITY_CENTERS[selectedCity];
    const mapZoom = userPosition ? 13 : 12;

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
                    <p className="text-xl text-gray-700 font-medium">Loading Court Tracker...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100" suppressHydrationWarning>
            <div className="max-w-6xl mx-auto px-4 py-8" suppressHydrationWarning>
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-3">
                        Court Tracker
                    </h1>
                    <p className="text-xl text-gray-700 mb-2">
                        Local Court Availability
                    </p>
                    <p className="text-green-700 font-medium">
                        Select a location to view court availability
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                        <Link
                            href="/nearby"
                            className="inline-block px-6 py-3 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg transition-colors"
                        >
                            Find courts near me
                        </Link>
                        <Link
                            href="/search"
                            className="inline-block px-6 py-3 rounded-full border-2 border-green-600 text-green-700 font-semibold hover:bg-green-50 transition-colors"
                        >
                            Search all courts
                        </Link>
                    </div>
                </div>

                {/* City Filter */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center bg-white rounded-full p-1 shadow-lg">
                        <button
                            onClick={() => setSelectedCity('brighton')}
                            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${selectedCity === 'brighton'
                                ? 'bg-green-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Brighton
                        </button>
                        <button
                            onClick={() => setSelectedCity('london')}
                            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${selectedCity === 'london'
                                ? 'bg-green-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            London
                        </button>
                    </div>
                </div>

                {/* Find nearest courts */}
                <div className="mb-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Find nearest courts</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Use your location or a UK postcode to sort courts by distance and centre the map.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <form onSubmit={handlePostcodeSearch} className="flex flex-1 gap-2">
                                <input
                                    type="text"
                                    value={postcodeInput}
                                    onChange={(e) => setPostcodeInput(e.target.value)}
                                    placeholder="e.g. BN1 4GW or SW1A 1AA"
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    disabled={locationLoading || !postcodeInput.trim()}
                                    className="px-5 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:bg-green-400 transition-colors"
                                >
                                    Search
                                </button>
                            </form>
                            <button
                                type="button"
                                onClick={handleUseMyLocation}
                                disabled={locationLoading}
                                className="px-5 py-3 rounded-xl border-2 border-green-600 text-green-700 font-medium hover:bg-green-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                                {locationLoading ? 'Locating…' : 'Use my location'}
                            </button>
                        </div>
                        {locationError && (
                            <p className="mt-3 text-sm text-red-600">{locationError}</p>
                        )}
                        {userPosition && locationLabel && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-gray-700">
                                    Showing distance from <strong>{locationLabel}</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={clearUserLocation}
                                    className="text-green-700 font-medium hover:text-green-800"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Court Map */}
                <div className="mb-10">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100">
                        <div className="px-6 py-4 border-b border-green-100">
                            <h2 className="text-2xl font-bold text-gray-900">Court Map</h2>
                            <p className="text-sm text-gray-600">
                                {userPosition
                                    ? `Courts in ${selectedCity === 'brighton' ? 'Brighton' : 'London'}, sorted by distance from you.`
                                    : `Explore court locations in ${selectedCity === 'brighton' ? 'Brighton' : 'London'}.`}
                            </p>
                        </div>
                        <div className="h-[380px]">
                            {mapsKeyConfigured ? (
                                <CourtMapLoader
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    courts={selectedCityLocations}
                                    userPosition={userPosition}
                                    selectedCourt={selectedMapLocation}
                                    onSelectCourt={(court) =>
                                        setSelectedMapLocation(
                                            court
                                                ? locations.find((l) => l.id === court.id) ?? null
                                                : null
                                        )
                                    }
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center bg-gray-50 px-6 text-center">
                                    <p className="text-gray-600 max-w-md">
                                        Add <code className="bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{' '}
                                        <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> (project root), then restart{' '}
                                        <code className="bg-gray-100 px-1 py-0.5 rounded">npm run dev</code>.
                                        <span className="block mt-2 text-sm text-gray-500">
                                            CRON_SECRET does not power the map — only the NEXT_PUBLIC key above.
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Locations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" suppressHydrationWarning>
                    {selectedCityLocations.map((location) => (
                        <div key={location.id} className="relative" suppressHydrationWarning>
                            {location.available ? (
                                <Link href={`/courts/${location.id}`}>
                                    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-green-300">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(location.type)}`}>
                                                    {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                                                </div>
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                {location.name}
                                                {userPosition && (
                                                    <span className="ml-2 text-sm font-medium text-green-700">
                                                        {formatDistance(distanceKm(userPosition, location))}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-4">
                                                {location.description}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-green-600 font-medium">
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    View Availability
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {location.price && (
                                                        <div className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs border border-blue-200">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                            </svg>
                                                            {location.price}
                                                        </div>
                                                    )}
                                                    {location.hasFloodLights && (
                                                        <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs border border-yellow-200">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                            </svg>
                                                            Lights
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-lg opacity-60 cursor-not-allowed border-2 border-gray-200">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(location.type)}`}>
                                                {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                                            </div>
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-5a6 6 0 11-12 0 6 6 0 0112 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {location.name}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4">
                                            {location.description}
                                        </p>
                                        <div className="flex items-center text-gray-400 font-medium">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-5a6 6 0 11-12 0 6 6 0 0112 0z" />
                                            </svg>
                                            Coming Soon
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gray-50 bg-opacity-50 rounded-2xl"></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>



                {/* Footer */}
                <div className="text-center mt-12 text-gray-600">
                    <p className="text-sm">
                        Built for local court enthusiasts
                    </p>
                </div>
            </div>
        </div>
    );
}