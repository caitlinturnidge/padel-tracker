'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  COURT_LOCATIONS,
  SEARCHABLE_COURTS,
  type CourtLocation,
  type City,
  type CourtType,
} from '@/lib/locations';
import {
  filterNonWorkingHours,
  groupSlotsByDay,
  type AvailabilitySlot,
  type CombinedSlot,
} from '@/lib/slots';

type SearchStatus = 'idle' | 'searching' | 'done' | 'error';

interface VenueSearchResult {
  locationId: string;
  status: 'pending' | 'loading' | 'done' | 'error';
  totalSlots: number;
  error?: string;
}

const CONCURRENCY = 3;

async function fetchVenueAvailability(
  locationId: string
): Promise<{ slots: AvailabilitySlot[]; error?: string }> {
  try {
    const response = await fetch(
      `/api/availability?location=${locationId}&t=${Date.now()}`,
      { headers: { 'Cache-Control': 'no-cache' } }
    );
    const data = await response.json();
    if (!data.success) {
      return { slots: [], error: data.error || 'Failed to fetch' };
    }
    return { slots: data.data ?? [] };
  } catch {
    return { slots: [], error: 'Network error' };
  }
}

async function searchCourtsInBatches(
  courts: CourtLocation[],
  onProgress: (results: VenueSearchResult[]) => void
): Promise<Map<string, AvailabilitySlot[]>> {
  const byVenue = new Map<string, AvailabilitySlot[]>();
  const progress: VenueSearchResult[] = courts.map((c) => ({
    locationId: c.id,
    status: 'pending',
    totalSlots: 0,
  }));

  const runCourt = async (court: CourtLocation, index: number) => {
    progress[index] = { ...progress[index], status: 'loading' };
    onProgress([...progress]);

    const { slots, error } = await fetchVenueAvailability(court.id);
    byVenue.set(court.id, slots);
    progress[index] = {
      locationId: court.id,
      status: error ? 'error' : 'done',
      totalSlots: slots.length,
      error,
    };
    onProgress([...progress]);
  };

  for (let i = 0; i < courts.length; i += CONCURRENCY) {
    const batch = courts.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map((court, batchOffset) => runCourt(court, i + batchOffset))
    );
  }

  return byVenue;
}

export default function SearchPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(SEARCHABLE_COURTS.map((c) => c.id))
  );
  const [sportFilter, setSportFilter] = useState<'all' | CourtType>('all');
  const [showAfterWorkOnly, setShowAfterWorkOnly] = useState(false);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [venueProgress, setVenueProgress] = useState<VenueSearchResult[]>([]);
  const [slotsByVenue, setSlotsByVenue] = useState<Map<string, AvailabilitySlot[]>>(
    new Map()
  );
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const selectedCourts = useMemo(
    () => SEARCHABLE_COURTS.filter((c) => selectedIds.has(c.id)),
    [selectedIds]
  );

  const toggleCourt = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectPreset = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const selectCity = (city: City) => {
    selectPreset(SEARCHABLE_COURTS.filter((c) => c.city === city).map((c) => c.id));
  };

  const runSearch = async () => {
    if (selectedCourts.length === 0) return;

    setSearchStatus('searching');
    setVenueProgress([]);
    setSlotsByVenue(new Map());

    const results = await searchCourtsInBatches(selectedCourts, setVenueProgress);
    setSlotsByVenue(results);
    setLastUpdated(new Date().toISOString());
    setSearchStatus('done');
  };

  const combinedSlots = useMemo(() => {
    const combined: CombinedSlot[] = [];

    selectedCourts.forEach((court) => {
      const slots = slotsByVenue.get(court.id) ?? [];
      slots.forEach((slot) => {
        combined.push({
          ...slot,
          venueId: court.id,
          venueName: court.name,
          venueType: court.type,
          bookingUrl: court.bookingUrl,
        });
      });
    });

    let filtered = combined;
    if (sportFilter !== 'all') {
      filtered = filtered.filter((s) => s.venueType === sportFilter);
    }
    if (showAfterWorkOnly) {
      filtered = filterNonWorkingHours(filtered);
    }

    return filtered.sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
  }, [selectedCourts, slotsByVenue, sportFilter, showAfterWorkOnly]);

  const groupedSlots = useMemo(
    () => groupSlotsByDay(combinedSlots),
    [combinedSlots]
  );

  const totalSlotsFound = combinedSlots.length;
  const courtsWithSlots = venueProgress.filter((v) => v.totalSlots > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-green-600 hover:text-green-700 font-medium mb-6"
        >
          ← Back to home
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Search all courts</h1>
          <p className="text-gray-700">
            Check availability across multiple venues in one go (next 2 weeks).
          </p>
        </div>

        {/* Presets */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-green-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Quick select</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                selectPreset(SEARCHABLE_COURTS.map((c) => c.id))
              }
              className="px-4 py-2 rounded-full text-sm font-medium bg-green-600 text-white hover:bg-green-700"
            >
              All courts ({SEARCHABLE_COURTS.length})
            </button>
            <button
              type="button"
              onClick={() => selectCity('brighton')}
              className="px-4 py-2 rounded-full text-sm font-medium border border-green-600 text-green-700 hover:bg-green-50"
            >
              All Brighton
            </button>
            <button
              type="button"
              onClick={() => selectCity('london')}
              className="px-4 py-2 rounded-full text-sm font-medium border border-green-600 text-green-700 hover:bg-green-50"
            >
              All London
            </button>
            <button
              type="button"
              onClick={() =>
                selectPreset(
                  SEARCHABLE_COURTS.filter((c) => c.type === 'tennis').map((c) => c.id)
                )
              }
              className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Tennis only
            </button>
            <button
              type="button"
              onClick={() =>
                selectPreset(
                  SEARCHABLE_COURTS.filter((c) => c.type === 'padel').map((c) => c.id)
                )
              }
              className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Padel only
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Court checkboxes */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-green-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Courts to search ({selectedIds.size} selected)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {SEARCHABLE_COURTS.map((court) => (
              <label
                key={court.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(court.id)}
                  onChange={() => toggleCourt(court.id)}
                  className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm text-gray-900">
                  <span className="font-medium">{court.name}</span>
                  <span className="text-gray-500 ml-1 capitalize">
                    ({court.city}, {court.type})
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <div className="flex items-center bg-white rounded-full p-1 shadow-lg">
            {(['all', 'tennis', 'padel'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSportFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                  sportFilter === f
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {f === 'all' ? 'All sports' : f}
              </button>
            ))}
          </div>
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
          <button
            type="button"
            onClick={runSearch}
            disabled={searchStatus === 'searching' || selectedIds.size === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-colors"
          >
            {searchStatus === 'searching'
              ? `Searching ${selectedIds.size} courts…`
              : `Search ${selectedIds.size} courts`}
          </button>
        </div>

        {/* Progress */}
        {searchStatus === 'searching' && venueProgress.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-green-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Progress</h2>
            <ul className="space-y-2">
              {venueProgress.map((v) => {
                const court = COURT_LOCATIONS.find((c) => c.id === v.locationId);
                return (
                  <li key={v.locationId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-800">{court?.name ?? v.locationId}</span>
                    <span className="text-gray-500">
                      {v.status === 'pending' && 'Waiting…'}
                      {v.status === 'loading' && 'Checking…'}
                      {v.status === 'done' && `${v.totalSlots} slots`}
                      {v.status === 'error' && (v.error ?? 'Error')}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Summary */}
        {searchStatus === 'done' && (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 max-w-lg mx-auto text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{totalSlotsFound}</div>
              <div className="text-gray-700 font-medium">slots across {courtsWithSlots} venues</div>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
              <button
                type="button"
                onClick={runSearch}
                className="mt-4 text-green-700 font-medium hover:text-green-800"
              >
                Search again
              </button>
            </div>

            {totalSlotsFound === 0 ? (
              <div className="text-center py-12 text-gray-600">
                No available slots found for the selected courts and filters.
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedSlots).map(([day, daySlots]) => (
                  <div
                    key={day}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
                      <h2 className="text-xl font-bold">{day}</h2>
                      <span className="text-sm bg-green-500 px-3 py-1 rounded-full">
                        {daySlots.length} slots
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {daySlots.map((slot, index) => (
                          <div
                            key={`${slot.venueId}-${slot.dateTime}-${index}`}
                            className="bg-green-50 border-2 border-green-200 rounded-xl p-4"
                          >
                            <div className="text-lg font-bold text-green-800">
                              {new Date(slot.dateTime).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mt-1">
                              {slot.venueName}
                            </div>
                            <div className="text-xs text-green-600 mb-3">
                              {slot.locationName}
                            </div>
                            <div className="flex gap-2">
                              {slot.bookingUrl ? (
                                <a
                                  href={slot.bookingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-3 rounded-lg"
                                >
                                  Book
                                </a>
                              ) : (
                                <Link
                                  href={`/courts/${slot.venueId}`}
                                  className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-3 rounded-lg"
                                >
                                  Details
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
