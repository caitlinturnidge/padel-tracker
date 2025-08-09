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
const PARAMS = {
  activityId: '149A001015',
  siteId: '149',
  locationId: '149ZPAD001'
};

async function fetchSlotAvailability(dateTime: Date): Promise<AvailabilitySlot | null> {
  const startDate = dateTime.toISOString();
  const url = `${BASE_URL}?activityId=${PARAMS.activityId}&siteId=${PARAMS.siteId}&locationId=${PARAMS.locationId}&startDate=${encodeURIComponent(startDate)}`;
  
  try {
    const response = await fetch(url);
    const data: ApiResponse = await response.json();
    
    if (data.success && data.data && data.data.length > 0) {
      return {
        ...data.data[0],
        dateTime: startDate
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching slot:', error);
    return null;
  }
}

export async function GET() {
  const now = new Date();
  const timeSlots: Date[] = [];
  
  // Generate all time slots for the next 14 days, every hour from 7 AM to 9 PM (courts close at 10pm)
  for (let day = 0; day < 14; day++) {
    for (let hour = 7; hour <= 21; hour++) {
      const slotTime = new Date(now);
      slotTime.setDate(now.getDate() + day);
      slotTime.setHours(hour, 0, 0, 0);
      timeSlots.push(slotTime);
    }
  }
  
  // Fetch all slots in parallel for much faster loading
  // Process in batches of 20 to avoid overwhelming the API
  const batchSize = 20;
  const slots: AvailabilitySlot[] = [];
  
  for (let i = 0; i < timeSlots.length; i += batchSize) {
    const batch = timeSlots.slice(i, i + batchSize);
    const batchPromises = batch.map(slotTime => fetchSlotAvailability(slotTime));
    const batchResults = await Promise.all(batchPromises);
    
    // Filter out null results and only include available slots
    const availableSlots = batchResults.filter((slot): slot is AvailabilitySlot => 
      slot !== null && 
      slot.availability > 0 && 
      slot.status.toLowerCase() === 'available'
    );
    slots.push(...availableSlots);
    
    // Small delay between batches to be respectful to the API
    if (i + batchSize < timeSlots.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return NextResponse.json({
    success: true,
    data: slots,
    lastUpdated: new Date().toISOString(),
    totalSlots: slots.length
  });
}