import { NextResponse } from 'next/server';

interface AvailabilitySlot {
  locationId: string;
  locationName: string;
  availability: number;
  bookableFrom: string;
  status: string;
  slotReferencesInCentre: string;
  dateTime: string; // We'll add this for easier frontend handling
}

interface ApiResponse {
  data: AvailabilitySlot[] | null;
  errors: string[];
  success: boolean;
}

const BASE_URL = 'https://www.placesleisure.org/umbraco/api/timetables/getgladstoneavailability';

// Simple in-memory cache to prevent duplicate API calls within the same request
const requestCache = new Map<string, Promise<AvailabilitySlot[]>>();

const LOCATION_CONFIGS: { [key: string]: { activityId: string; siteId: string; locationId: string; type: 'triangle' | 'hove' | 'patcham' } } = {
  'triangle-padel': {
    activityId: '149A001015',
    siteId: '149',
    locationId: '149ZPAD001',
    type: 'triangle'
  },
  'triangle-tennis': {
    activityId: '149A000010',
    siteId: '149',
    locationId: 'MultipleLocation_a9001c36-c5a8-42f0-9ac2-c33cfd0671d0',
    type: 'triangle'
  },
  'hove-tennis': {
    activityId: '2668', // facility ID for Matchi
    siteId: '1', // sport ID for tennis
    locationId: '', // not used for Matchi
    type: 'hove'
  },
  'patcham-tennis': {
    activityId: '883bec85-55c3-4765-82e9-87c94210abde', // venue ID for LTA
    siteId: '', // not used for LTA
    locationId: '', // not used for LTA
    type: 'patcham'
  }
};

async function fetchHoveSlotAvailability(dateTime: Date): Promise<AvailabilitySlot[]> {
  const dateStr = dateTime.toISOString().split('T')[0]; // Format: 2025-08-10
  const url = `https://www.matchi.se/book/listSlots?facility=2668&date=${dateStr}&sport=1`;
  
  // Check cache first to prevent duplicate calls
  const cacheKey = `hove-${dateStr}`;
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }
  
  const fetchPromise = (async () => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    const slots: AvailabilitySlot[] = [];
    
    // Much simpler approach: look for all "Tennis Court X" entries that have a "Book" button
    // This indicates an available court
    const availableCourtRegex = /<td[^>]*>\s*(Tennis Court \d+)\s*<\/td>[\s\S]*?<strong>(\d+)<sup>(\d+)<\/sup><\/strong>[\s\S]*?class="btn btn-success btn-sm"/g;
    
    let match;
    while ((match = availableCourtRegex.exec(html)) !== null) {
      const courtName = match[1]; // "Tennis Court 5"
      const hour = parseInt(match[2]); // "08"
      const minute = parseInt(match[3]); // "00"
      
      // Create the datetime for this slot
      const slotDateTime = new Date(dateTime);
      slotDateTime.setHours(hour, minute, 0, 0);
      
      slots.push({
        locationId: `hove-${courtName.toLowerCase().replace(/\s+/g, '-')}`,
        locationName: courtName,
        availability: 1,
        bookableFrom: slotDateTime.toISOString(),
        status: 'Available',
        slotReferencesInCentre: '',
        dateTime: slotDateTime.toISOString()
      });
    }
    
    // If the above doesn't work, try a different approach
    if (slots.length === 0) {
      console.log('First regex failed, trying alternative approach...');
      
      // Look for time slots first, then find courts within them
      const timeSlotRegex = /<h6>[\s\S]*?<strong>(\d+)<sup>(\d+)<\/sup><\/strong>[\s\S]*?<\/h6>([\s\S]*?)(?=<\/ul>)/g;
      
      let timeMatch;
      while ((timeMatch = timeSlotRegex.exec(html)) !== null) {
        const hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2]);
        const sectionContent = timeMatch[3];
        
        // Find all courts in this time section that have Book buttons
        const courtInSectionRegex = /<td[^>]*>\s*(Tennis Court \d+)\s*<\/td>[\s\S]*?class="btn btn-success btn-sm"/g;
        
        let courtMatch;
        while ((courtMatch = courtInSectionRegex.exec(sectionContent)) !== null) {
          const courtName = courtMatch[1];
          
          // Create the datetime for this slot
          const slotDateTime = new Date(dateTime);
          slotDateTime.setHours(hour, minute, 0, 0);
          
          slots.push({
            locationId: `hove-${courtName.toLowerCase().replace(/\s+/g, '-')}`,
            locationName: courtName,
            availability: 1,
            bookableFrom: slotDateTime.toISOString(),
            status: 'Available',
            slotReferencesInCentre: '',
            dateTime: slotDateTime.toISOString()
          });
        }
      }
    }
    
    console.log(`Found ${slots.length} Hove tennis slots for ${dateStr}`);
    return slots;
  } catch (error) {
    console.error('Error fetching Hove slots:', error);
    return [];
  }
  })();
  
  requestCache.set(cacheKey, fetchPromise);
  return fetchPromise;
}

async function fetchTriangleSlotAvailability(dateTime: Date, locationKey: string): Promise<AvailabilitySlot[]> {
  const startDate = dateTime.toISOString();
  const config = LOCATION_CONFIGS[locationKey];
  
  const url = `${BASE_URL}?activityId=${config.activityId}&siteId=${config.siteId}&locationId=${config.locationId}&startDate=${encodeURIComponent(startDate)}`;
  
  // Check cache first to prevent duplicate calls
  const cacheKey = `triangle-${locationKey}-${startDate}`;
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }
  
  const fetchPromise = (async () => {
    try {
      const response = await fetch(url);
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // For tennis, we get multiple courts per time slot, so return all available ones
        return data.data
          .filter(slot => slot.availability > 0 && slot.status.toLowerCase() === 'available')
          .map(slot => ({
            ...slot,
            dateTime: startDate
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

async function fetchPatchamSlotAvailability(dateTime: Date): Promise<AvailabilitySlot[]> {
  const dateStr = dateTime.toISOString().split('T')[0]; // Format: 2025-08-14
  const url = `https://www.lta.org.uk/api/courtdetail/availability?venueid=883bec85-55c3-4765-82e9-87c94210abde&date=${dateStr}`;
  
  // Check cache first to prevent duplicate calls
  const cacheKey = `patcham-${dateStr}`;
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }
  
  const fetchPromise = (async () => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const slots: AvailabilitySlot[] = [];
    
    if (data.venueDetails && Array.isArray(data.venueDetails)) {
      data.venueDetails.forEach((court: any) => {
        if (court.availableSlots && Array.isArray(court.availableSlots)) {
          court.availableSlots.forEach((slot: any) => {
            slots.push({
              locationId: `patcham-${court.name.toLowerCase().replace(/\s+/g, '-')}`,
              locationName: court.name,
              availability: 1,
              bookableFrom: slot.startTime,
              status: 'Available',
              slotReferencesInCentre: slot.slotId || '',
              dateTime: slot.startTime
            });
          });
        }
      });
    }
    
    console.log(`Found ${slots.length} Patcham tennis slots for ${dateStr}`);
    return slots;
  } catch (error) {
    console.error('Error fetching Patcham slots:', error);
    return [];
  }
  })();
  
  requestCache.set(cacheKey, fetchPromise);
  return fetchPromise;
}

async function fetchSlotAvailability(dateTime: Date, locationKey: string): Promise<AvailabilitySlot[]> {
  const config = LOCATION_CONFIGS[locationKey];
  
  if (!config) {
    console.error('Unknown location:', locationKey);
    return [];
  }
  
  if (config.type === 'hove') {
    return fetchHoveSlotAvailability(dateTime);
  } else if (config.type === 'patcham') {
    return fetchPatchamSlotAvailability(dateTime);
  } else {
    return fetchTriangleSlotAvailability(dateTime, locationKey);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationKey = searchParams.get('location') || 'triangle-padel'; // Default to triangle-padel for backward compatibility
  
  // Validate location
  if (!LOCATION_CONFIGS[locationKey]) {
    return NextResponse.json({
      success: false,
      error: 'Invalid location specified',
      availableLocations: Object.keys(LOCATION_CONFIGS)
    }, { status: 400 });
  }
  
  const now = new Date();
  const timeSlots: Date[] = [];
  
  // For Hove and Patcham, we only need to call once per day since they return all slots for the day
  // For Triangle, we need to call for each hour
  if (LOCATION_CONFIGS[locationKey].type === 'hove' || LOCATION_CONFIGS[locationKey].type === 'patcham') {
    // Generate one slot per day for Hove/Patcham (since they return all day's slots)
    for (let day = 0; day < 14; day++) {
      const slotTime = new Date(now);
      slotTime.setDate(now.getDate() + day);
      slotTime.setHours(12, 0, 0, 0); // Use noon as a reference time
      timeSlots.push(slotTime);
    }
  } else {
    // Generate time slots for Triangle locations (every 2 hours from 7 AM to 9 PM for efficiency)
    // This reduces API calls from 210 to 105 while maintaining good coverage
    for (let day = 0; day < 14; day++) {
      for (let hour = 7; hour <= 21; hour += 2) { // Every 2 hours instead of every hour
        const slotTime = new Date(now);
        slotTime.setDate(now.getDate() + day);
        slotTime.setHours(hour, 0, 0, 0);
        timeSlots.push(slotTime);
      }
    }
  }
  
  // Fetch all slots in parallel for maximum speed
  // Different strategies based on API type for optimal performance
  const allSlots: AvailabilitySlot[] = [];
  
  if (LOCATION_CONFIGS[locationKey].type === 'hove' || LOCATION_CONFIGS[locationKey].type === 'patcham') {
    // For Hove/Patcham: All 14 days in parallel (no batching needed, only 14 calls)
    console.log(`Fetching ${timeSlots.length} days in parallel for ${locationKey}`);
    const allPromises = timeSlots.map(slotTime => fetchSlotAvailability(slotTime, locationKey));
    const allResults = await Promise.all(allPromises);
    allSlots.push(...allResults.flat());
  } else {
    // For Triangle: Maximum speed - all calls in parallel with no delays
    console.log(`Fetching ${timeSlots.length} time slots in parallel for ${locationKey}`);
    const allPromises = timeSlots.map(slotTime => fetchSlotAvailability(slotTime, locationKey));
    const allResults = await Promise.all(allPromises);
    allSlots.push(...allResults.flat());
  }
  
  // Remove any potential duplicates based on dateTime and locationName
  const uniqueSlots = allSlots.filter((slot, index, self) => 
    index === self.findIndex(s => s.dateTime === slot.dateTime && s.locationName === slot.locationName)
  );

  const response = NextResponse.json({
    success: true,
    data: uniqueSlots,
    location: locationKey,
    lastUpdated: new Date().toISOString(),
    totalSlots: uniqueSlots.length
  });

  // Clear request cache to prevent memory leaks
  requestCache.clear();

  // Add Vercel caching headers
  // Cache for 5 minutes (300 seconds) with stale-while-revalidate for 1 hour
  response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
  
  return response;
}