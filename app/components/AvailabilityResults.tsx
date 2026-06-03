'use client';

import Link from 'next/link';
import {
  filterNonWorkingHours,
  groupSlotsByDay,
  type AvailabilitySlot,
  type CombinedSlot,
} from '@/lib/slots';
import { formatDistance } from '@/lib/geo';
import { COURT_LOCATIONS } from '@/lib/locations';
import type { VenueSearchResult } from '@/lib/searchAvailability';

interface AvailabilityResultsProps {
  groupedSlots: Record<string, CombinedSlot[]>;
  totalSlots: number;
  courtsWithSlots: number;
  lastUpdated: string | null;
  onSearchAgain: () => void;
  showVenueDistance?: boolean;
}

export function AvailabilitySearchProgress({
  venueProgress,
}: {
  venueProgress: VenueSearchResult[];
}) {
  const done = venueProgress.filter((v) => v.status === 'done' || v.status === 'error').length;
  const total = venueProgress.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-green-100">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-900">Checking courts…</h2>
        <span className="text-sm text-gray-500">
          {done} / {total}
        </span>
      </div>
      <div className="h-2 bg-green-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-green-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {venueProgress.map((v) => {
          const court = COURT_LOCATIONS.find((c) => c.id === v.locationId);
          return (
            <li key={v.locationId} className="flex items-center justify-between text-sm">
              <span className="text-gray-800">{court?.name ?? v.locationId}</span>
              <span className="text-gray-500">
                {v.status === 'pending' && 'Waiting…'}
                {v.status === 'loading' && (
                  <span className="text-green-600">Checking…</span>
                )}
                {v.status === 'done' && (
                  <span className="text-green-700 font-medium">{v.totalSlots} slots</span>
                )}
                {v.status === 'error' && (
                  <span className="text-red-600">{v.error ?? 'Error'}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AvailabilityResults({
  groupedSlots,
  totalSlots,
  courtsWithSlots,
  lastUpdated,
  onSearchAgain,
  showVenueDistance,
}: AvailabilityResultsProps) {
  if (totalSlots === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
        <p className="text-xl font-semibold text-gray-800 mb-2">No slots found</p>
        <p className="text-gray-600 mb-6">
          Try a larger radius, different times filter, or search again later.
        </p>
        <button
          type="button"
          onClick={onSearchAgain}
          className="text-green-700 font-medium hover:text-green-800"
        >
          Search again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 max-w-lg mx-auto text-center">
        <div className="text-4xl font-bold text-green-600 mb-1">{totalSlots}</div>
        <div className="text-gray-700 font-medium">
          open {totalSlots === 1 ? 'slot' : 'slots'} at {courtsWithSlots}{' '}
          {courtsWithSlots === 1 ? 'venue' : 'venues'}
        </div>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Updated {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      <div className="space-y-8">
        {Object.entries(groupedSlots).map(([day, daySlots]) => (
          <div key={day} className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
                    className="bg-green-50 border-2 border-green-200 rounded-xl p-4 hover:border-green-400 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="text-lg font-bold text-green-800">
                        {new Date(slot.dateTime).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {showVenueDistance && slot.venueDistanceKm != null && (
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full shrink-0">
                          {formatDistance(slot.venueDistanceKm)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{slot.venueName}</div>
                    <div className="text-xs text-green-600 mb-3 capitalize">
                      {slot.venueType} · {slot.locationName}
                    </div>
                    {slot.bookingUrl ? (
                      <a
                        href={slot.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg"
                      >
                        Book now
                      </a>
                    ) : (
                      <Link
                        href={`/courts/${slot.venueId}`}
                        className="block w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg"
                      >
                        View & book
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function buildGroupedSlots(
  courts: { id: string; name: string; type: 'padel' | 'tennis'; bookingUrl?: string; distanceKm?: number }[],
  slotsByVenue: Map<string, AvailabilitySlot[]>,
  sportFilter: 'all' | 'padel' | 'tennis',
  showAfterWorkOnly: boolean
): { combined: CombinedSlot[]; grouped: Record<string, CombinedSlot[]> } {
  let combined: CombinedSlot[] = [];
  courts.forEach((court) => {
    const slots = slotsByVenue.get(court.id) ?? [];
    slots.forEach((slot) => {
      combined.push({
        ...slot,
        venueId: court.id,
        venueName: court.name,
        venueType: court.type,
        bookingUrl: court.bookingUrl,
        venueDistanceKm: court.distanceKm,
      });
    });
  });

  if (sportFilter !== 'all') {
    combined = combined.filter((s) => s.venueType === sportFilter);
  }
  if (showAfterWorkOnly) {
    combined = filterNonWorkingHours(combined);
  }
  combined.sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  return { combined, grouped: groupSlotsByDay(combined) };
}
