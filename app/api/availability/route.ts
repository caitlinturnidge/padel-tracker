import { NextResponse } from 'next/server';
import {
  AVAILABILITY_LOCATION_CONFIGS,
  type AvailabilityLocationConfig,
} from '@/lib/availabilityConfig';

interface AvailabilitySlot {
  locationId: string;
  locationName: string;
  availability: number;
  bookableFrom: string;
  status: string;
  slotReferencesInCentre: string;
  dateTime: string;
}

interface ApiResponse {
  data: AvailabilitySlot[] | null;
  errors: string[];
  success: boolean;
}

const BASE_URL = 'https://www.placesleisure.org/umbraco/api/timetables/getgladstoneavailability';

const requestCache = new Map<string, Promise<AvailabilitySlot[]>>();

async function fetchMatchiSlotAvailability(
  dateTime: Date,
  locationKey: string,
  config: AvailabilityLocationConfig
): Promise<AvailabilitySlot[]> {
  const dateStr = dateTime.toISOString().split('T')[0];
  const facilityId = config.activityId;
  const sportId = config.siteId;
  const url = `https://www.matchi.se/book/listSlots?facility=${facilityId}&date=${dateStr}&sport=${sportId}`;

  const cacheKey = `matchi-${locationKey}-${dateStr}`;
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url);
      const html = await response.text();

      const slots: AvailabilitySlot[] = [];

      const availableCourtRegex =
        /<td[^>]*>\s*((?:Tennis|Padel) Court \d+|Padel)\s*<\/td>[\s\S]*?<strong>(\d+)<sup>(\d+)<\/sup><\/strong>[\s\S]*?class="btn btn-success btn-sm"/g;

      let match;
      while ((match = availableCourtRegex.exec(html)) !== null) {
        const courtName = match[1];
        const hour = parseInt(match[2], 10);
        const minute = parseInt(match[3], 10);

        const slotDateTime = new Date(dateTime);
        slotDateTime.setHours(hour, minute, 0, 0);

        slots.push({
          locationId: `${locationKey}-${courtName.toLowerCase().replace(/\s+/g, '-')}`,
          locationName: courtName,
          availability: 1,
          bookableFrom: slotDateTime.toISOString(),
          status: 'Available',
          slotReferencesInCentre: '',
          dateTime: slotDateTime.toISOString(),
        });
      }

      if (slots.length === 0) {
        const timeSlotRegex =
          /<h6>[\s\S]*?<strong>(\d+)<sup>(\d+)<\/sup><\/strong>[\s\S]*?<\/h6>([\s\S]*?)(?=<\/ul>)/g;

        let timeMatch;
        while ((timeMatch = timeSlotRegex.exec(html)) !== null) {
          const hour = parseInt(timeMatch[1], 10);
          const minute = parseInt(timeMatch[2], 10);
          const sectionContent = timeMatch[3];

          const courtInSectionRegex =
            /<td[^>]*>\s*((?:Tennis|Padel) Court \d+|Padel)\s*<\/td>[\s\S]*?class="btn btn-success btn-sm"/g;

          let courtMatch;
          while ((courtMatch = courtInSectionRegex.exec(sectionContent)) !== null) {
            const courtName = courtMatch[1];
            const slotDateTime = new Date(dateTime);
            slotDateTime.setHours(hour, minute, 0, 0);

            slots.push({
              locationId: `${locationKey}-${courtName.toLowerCase().replace(/\s+/g, '-')}`,
              locationName: courtName,
              availability: 1,
              bookableFrom: slotDateTime.toISOString(),
              status: 'Available',
              slotReferencesInCentre: '',
              dateTime: slotDateTime.toISOString(),
            });
          }
        }
      }

      // Single-court venues (e.g. Tower Hill) may only expose Book buttons without court names
      if (slots.length === 0 && html.includes('btn btn-success btn-sm')) {
        const timeOnlyRegex = /<strong>(\d+)<sup>(\d+)<\/sup><\/strong>[\s\S]{0,800}?class="btn btn-success btn-sm"/g;
        let timeOnlyMatch;
        while ((timeOnlyMatch = timeOnlyRegex.exec(html)) !== null) {
          const hour = parseInt(timeOnlyMatch[1], 10);
          const minute = parseInt(timeOnlyMatch[2], 10);
          const slotDateTime = new Date(dateTime);
          slotDateTime.setHours(hour, minute, 0, 0);

          slots.push({
            locationId: `${locationKey}-court-1`,
            locationName: 'Court 1',
            availability: 1,
            bookableFrom: slotDateTime.toISOString(),
            status: 'Available',
            slotReferencesInCentre: '',
            dateTime: slotDateTime.toISOString(),
          });
        }
      }

      return slots;
    } catch (error) {
      console.error(`Error fetching Matchi slots for ${locationKey}:`, error);
      return [];
    }
  })();

  requestCache.set(cacheKey, fetchPromise);
  return fetchPromise;
}

async function fetchTriangleSlotAvailability(
  dateTime: Date,
  locationKey: string,
  config: AvailabilityLocationConfig
): Promise<AvailabilitySlot[]> {
  const startDate = dateTime.toISOString();
  const url = `${BASE_URL}?activityId=${config.activityId}&siteId=${config.siteId}&locationId=${config.locationId}&startDate=${encodeURIComponent(startDate)}`;

  const cacheKey = `triangle-${locationKey}-${startDate}`;
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url);
      const data: ApiResponse = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        return data.data
          .filter((slot) => slot.availability > 0 && slot.status.toLowerCase() === 'available')
          .map((slot) => ({
            ...slot,
            dateTime: startDate,
          }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching Triangle slots:', error);
      return [];
    }
  })();

  requestCache.set(cacheKey, fetchPromise);
  return fetchPromise;
}

async function fetchLtaSlotAvailability(
  dateTime: Date,
  locationKey: string,
  config: AvailabilityLocationConfig
): Promise<AvailabilitySlot[]> {
  const dateStr = dateTime.toISOString().split('T')[0];
  const venueId = config.activityId;
  const url = `https://www.lta.org.uk/api/courtdetail/availability?venueid=${venueId}&date=${dateStr}`;

  const cacheKey = `lta-${locationKey}-${dateStr}`;
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url);
      const data = await response.json();

      const slots: AvailabilitySlot[] = [];

      if (data.venueDetails && Array.isArray(data.venueDetails)) {
        data.venueDetails.forEach((court: { name: string; availableSlots?: { startTime: string; slotId?: string }[] }) => {
          if (court.availableSlots && Array.isArray(court.availableSlots)) {
            court.availableSlots.forEach((slot) => {
              slots.push({
                locationId: `${locationKey}-${court.name.toLowerCase().replace(/\s+/g, '-')}`,
                locationName: court.name,
                availability: 1,
                bookableFrom: slot.startTime,
                status: 'Available',
                slotReferencesInCentre: slot.slotId || '',
                dateTime: slot.startTime,
              });
            });
          }
        });
      }

      return slots;
    } catch (error) {
      console.error(`Error fetching LTA slots for ${locationKey}:`, error);
      return [];
    }
  })();

  requestCache.set(cacheKey, fetchPromise);
  return fetchPromise;
}

async function fetchSlotAvailability(
  dateTime: Date,
  locationKey: string
): Promise<AvailabilitySlot[]> {
  const config = AVAILABILITY_LOCATION_CONFIGS[locationKey];

  if (!config) {
    console.error('Unknown location:', locationKey);
    return [];
  }

  if (config.type === 'matchi') {
    return fetchMatchiSlotAvailability(dateTime, locationKey, config);
  }
  if (config.type === 'lta') {
    return fetchLtaSlotAvailability(dateTime, locationKey, config);
  }
  return fetchTriangleSlotAvailability(dateTime, locationKey, config);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationKey = searchParams.get('location') || 'triangle-padel';

  if (!AVAILABILITY_LOCATION_CONFIGS[locationKey]) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid location specified',
        availableLocations: Object.keys(AVAILABILITY_LOCATION_CONFIGS),
      },
      { status: 400 }
    );
  }

  const config = AVAILABILITY_LOCATION_CONFIGS[locationKey];
  const now = new Date();
  const timeSlots: Date[] = [];

  if (config.type === 'matchi' || config.type === 'lta') {
    for (let day = 0; day < 14; day++) {
      const slotTime = new Date(now);
      slotTime.setDate(now.getDate() + day);
      slotTime.setHours(12, 0, 0, 0);
      timeSlots.push(slotTime);
    }
  } else {
    for (let day = 0; day < 14; day++) {
      for (let hour = 7; hour <= 21; hour += 2) {
        const slotTime = new Date(now);
        slotTime.setDate(now.getDate() + day);
        slotTime.setHours(hour, 0, 0, 0);
        timeSlots.push(slotTime);
      }
    }
  }

  const allPromises = timeSlots.map((slotTime) => fetchSlotAvailability(slotTime, locationKey));
  const allResults = await Promise.all(allPromises);
  const allSlots = allResults.flat();

  const uniqueSlots = allSlots.filter(
    (slot, index, self) =>
      index === self.findIndex((s) => s.dateTime === slot.dateTime && s.locationName === slot.locationName)
  );

  const response = NextResponse.json({
    success: true,
    data: uniqueSlots,
    location: locationKey,
    lastUpdated: new Date().toISOString(),
    totalSlots: uniqueSlots.length,
  });

  requestCache.clear();
  response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');

  return response;
}
