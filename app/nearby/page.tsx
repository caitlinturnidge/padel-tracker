'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import AvailabilityResults, {
  AvailabilitySearchProgress,
  buildGroupedSlots,
} from '@/app/components/AvailabilityResults';
import CourtMapLoader from '@/app/components/CourtMapLoader';
import DistanceRadiusControl, {
  DEFAULT_RADIUS_KM,
} from '@/app/components/DistanceRadiusControl';
import LocationPicker, { type UserLocation } from '@/app/components/LocationPicker';
import { formatDistance } from '@/lib/geo';
import { isGoogleMapsKeyConfigured } from '@/lib/googleMaps';
import { SEARCHABLE_COURTS, type CourtType } from '@/lib/locations';
import {
  courtsWithinRadius,
  zoomForRadiusKm,
  type CourtWithDistance,
} from '@/lib/nearby';
import { searchCourtsInBatches, type VenueSearchResult } from '@/lib/searchAvailability';

type SearchStatus = 'idle' | 'searching' | 'done';

function StepBadge({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
          done
            ? 'bg-green-600 text-white'
            : active
              ? 'bg-green-100 text-green-800 ring-2 ring-green-600'
              : 'bg-gray-100 text-gray-400'
        }`}
      >
        {done ? '✓' : n}
      </span>
      <span
        className={`text-sm font-medium hidden sm:inline ${
          active || done ? 'text-gray-900' : 'text-gray-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function NearbySearchPage() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [sportFilter, setSportFilter] = useState<'all' | CourtType>('all');
  const [showAfterWorkOnly, setShowAfterWorkOnly] = useState(false);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [venueProgress, setVenueProgress] = useState<VenueSearchResult[]>([]);
  const [slotsByVenue, setSlotsByVenue] = useState(
    () => new Map<string, import('@/lib/slots').AvailabilitySlot[]>()
  );
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedMapCourtId, setSelectedMapCourtId] = useState<string | null>(null);

  const mapsConfigured = isGoogleMapsKeyConfigured();

  const courtsInRange: CourtWithDistance[] = useMemo(() => {
    if (!userLocation) return [];
    let list = courtsWithinRadius(
      userLocation.position,
      SEARCHABLE_COURTS,
      radiusKm
    );
    if (sportFilter !== 'all') {
      list = list.filter((c) => c.type === sportFilter);
    }
    return list;
  }, [userLocation, radiusKm, sportFilter]);

  const { combined: combinedSlots, grouped: groupedSlots } = useMemo(() => {
    if (searchStatus !== 'done') {
      return { combined: [], grouped: {} };
    }
    return buildGroupedSlots(
      courtsInRange,
      slotsByVenue,
      sportFilter,
      showAfterWorkOnly
    );
  }, [searchStatus, courtsInRange, slotsByVenue, sportFilter, showAfterWorkOnly]);

  const courtsWithSlots = venueProgress.filter((v) => v.totalSlots > 0).length;
  const step1Done = !!userLocation;
  const step2Active = step1Done;
  const canSearch = step1Done && courtsInRange.length > 0 && searchStatus !== 'searching';

  const runSearch = async () => {
    if (!canSearch) return;
    setSearchStatus('searching');
    setVenueProgress([]);
    setSlotsByVenue(new Map());
    const results = await searchCourtsInBatches(courtsInRange, setVenueProgress);
    setSlotsByVenue(results);
    setLastUpdated(new Date().toISOString());
    setSearchStatus('done');
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
  };

  const mapCourts = courtsInRange.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    available: c.available,
    lat: c.lat,
    lng: c.lng,
  }));

  const selectedMapCourt =
    mapCourts.find((c) => c.id === selectedMapCourtId) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pb-28">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-green-600 hover:text-green-700 font-medium mb-6"
        >
          ← Home
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Courts near you</h1>
          <p className="text-gray-700 max-w-xl mx-auto">
            Set your location, choose how far you&apos;ll travel, and we&apos;ll check
            availability at every court in range.
          </p>
        </div>

        <div className="flex justify-center gap-6 sm:gap-10 mb-8">
          <StepBadge n={1} label="Your location" active={!step1Done} done={step1Done} />
          <div className="w-8 h-0.5 bg-gray-200 self-center hidden sm:block" />
          <StepBadge n={2} label="Distance" active={step2Active && searchStatus === 'idle'} done={searchStatus !== 'idle'} />
          <div className="w-8 h-0.5 bg-gray-200 self-center hidden sm:block" />
          <StepBadge n={3} label="Availability" active={searchStatus === 'searching'} done={searchStatus === 'done'} />
        </div>

        {/* Step 1: Location */}
        <section className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-green-100">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Where are you?</h2>
          <p className="text-sm text-gray-600 mb-4">
            We use this as the centre of your search — nothing is stored.
          </p>
          <LocationPicker value={userLocation} onChange={setUserLocation} />
        </section>

        {/* Step 2: Radius + preview */}
        <section
          className={`bg-white rounded-2xl shadow-lg p-6 mb-6 border border-green-100 transition-opacity ${
            step1Done ? '' : 'opacity-60'
          }`}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-1">How far will you go?</h2>
          <p className="text-sm text-gray-600 mb-4">
            {step1Done
              ? 'Drag the slider or tap a preset — courts update instantly.'
              : 'Set your location first.'}
          </p>
          <DistanceRadiusControl
            radiusKm={radiusKm}
            onChange={setRadiusKm}
            courtsInRange={courtsInRange.length}
            disabled={!step1Done}
          />

          {step1Done && (
            <>
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
                <span className="text-sm text-gray-500 w-full sm:w-auto sm:mr-2 self-center">
                  Sport:
                </span>
                {(['all', 'tennis', 'padel'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSportFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
                      sportFilter === f
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mapsConfigured && (
                  <div className="h-[280px] lg:h-[320px] rounded-xl overflow-hidden border border-green-100">
                    <CourtMapLoader
                      center={userLocation!.position}
                      zoom={zoomForRadiusKm(radiusKm)}
                      courts={mapCourts}
                      userPosition={userLocation!.position}
                      radiusKm={radiusKm}
                      selectedCourt={selectedMapCourt}
                      onSelectCourt={(c) => setSelectedMapCourtId(c?.id ?? null)}
                    />
                  </div>
                )}

                <div
                  className={`space-y-2 max-h-[320px] overflow-y-auto ${
                    mapsConfigured ? '' : 'lg:col-span-2'
                  }`}
                >
                  {courtsInRange.length === 0 ? (
                    <p className="text-gray-600 text-sm p-4 bg-gray-50 rounded-xl">
                      No courts match your filters within {radiusKm} km. Increase the
                      radius or include more sports.
                    </p>
                  ) : (
                    courtsInRange.map((court) => (
                      <div
                        key={court.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                          selectedMapCourtId === court.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-100 bg-gray-50 hover:border-green-200'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{court.name}</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {court.type} · {court.city}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-green-700 tabular-nums">
                          {formatDistance(court.distanceKm)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Filters before search */}
        {step1Done && courtsInRange.length > 0 && searchStatus !== 'searching' && (
          <div className="flex justify-center mb-6">
            <div className="flex items-center bg-white rounded-full p-1 shadow-lg">
              <button
                type="button"
                onClick={() => setShowAfterWorkOnly(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  !showAfterWorkOnly ? 'bg-green-600 text-white' : 'text-gray-600'
                }`}
              >
                All times
              </button>
              <button
                type="button"
                onClick={() => setShowAfterWorkOnly(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  showAfterWorkOnly ? 'bg-green-600 text-white' : 'text-gray-600'
                }`}
              >
                Evenings & weekends
              </button>
            </div>
          </div>
        )}

        {searchStatus === 'searching' && (
          <AvailabilitySearchProgress venueProgress={venueProgress} />
        )}

        <div id="results">
          {searchStatus === 'done' && (
            <AvailabilityResults
              groupedSlots={groupedSlots}
              totalSlots={combinedSlots.length}
              courtsWithSlots={courtsWithSlots}
              lastUpdated={lastUpdated}
              onSearchAgain={runSearch}
              showVenueDistance
            />
          )}
        </div>

        <p className="text-center mt-8 text-sm text-gray-500">
          Want to pick courts manually?{' '}
          <Link href="/search" className="text-green-700 font-medium hover:underline">
            Search all courts
          </Link>
        </p>
      </div>

      {/* Sticky CTA */}
      {step1Done && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-green-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-700 text-center sm:text-left">
              {courtsInRange.length === 0 ? (
                <span className="text-amber-700 font-medium">Increase radius to find courts</span>
              ) : (
                <>
                  Ready to search{' '}
                  <strong className="text-green-700">{courtsInRange.length}</strong>{' '}
                  {courtsInRange.length === 1 ? 'court' : 'courts'} within{' '}
                  <strong>{radiusKm} km</strong>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={runSearch}
              disabled={!canSearch}
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold shadow-lg transition-colors"
            >
              {searchStatus === 'searching'
                ? 'Searching…'
                : `Find availability nearby`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
