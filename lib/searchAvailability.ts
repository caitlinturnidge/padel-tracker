import type { CourtLocation } from '@/lib/locations';
import type { AvailabilitySlot } from '@/lib/slots';

export type VenueSearchStatus = 'pending' | 'loading' | 'done' | 'error';

export interface VenueSearchResult {
  locationId: string;
  status: VenueSearchStatus;
  totalSlots: number;
  error?: string;
}

const CONCURRENCY = 3;

export async function fetchVenueAvailability(
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

export async function searchCourtsInBatches(
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
