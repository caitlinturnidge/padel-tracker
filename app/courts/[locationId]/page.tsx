'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
  success: boolean;
  data: AvailabilitySlot[];
  lastUpdated: string;
  totalSlots: number;
}

const locationConfig: { [key: string]: { 
  name: string; 
  description: string; 
  hasFloodLights: boolean;
  pricing?: { [timeSlot: string]: number };
} } = {
  'triangle-padel': {
    name: 'Triangle Padel',
    description: 'The Triangle Leisure Centre - Padel Courts',
    hasFloodLights: false
  },
  'triangle-tennis': {
    name: 'Triangle Tennis',
    description: 'The Triangle Leisure Centre - Tennis Courts',
    hasFloodLights: false
  },
  'hove-tennis': {
    name: 'Hove Tennis',
    description: 'Seafront Tennis Courts',
    hasFloodLights: true
  },
  'patcham-tennis': {
    name: 'Patcham Tennis',
    description: 'Patcham Tennis Courts',
    hasFloodLights: false
  }
};

export default function CourtAvailability() {
  const params = useParams();
  const locationId = params.locationId as string;
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showAfterWorkOnly, setShowAfterWorkOnly] = useState(false);

  const location = locationConfig[locationId];

  // Debug logging
  console.log('Location ID:', locationId);
  console.log('Available locations:', Object.keys(locationConfig));
  console.log('Location found:', location);

  // Handle case where locationId might not be loaded yet
  if (!locationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if location is supported
      if (locationId !== 'triangle-padel' && locationId !== 'triangle-tennis' && locationId !== 'hove-tennis' && locationId !== 'patcham-tennis') {
        setError('This location is not yet available');
        setLoading(false);
        return;
      }

      // Add cache-busting parameter to force fresh data when manually refreshing
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/availability?location=${locationId}&t=${timestamp}`, {
        // Add caching headers for client-side caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setSlots(data.data);
        setLastUpdated(data.lastUpdated);
      } else {
        setError('Failed to fetch availability data');
      }
    } catch (err) {
      setError('Error fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [locationId]);

  const filterNonWorkingHours = (slots: AvailabilitySlot[]) => {
    if (!showAfterWorkOnly) return slots;
    
    return slots.filter(slot => {
      const date = new Date(slot.dateTime);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = date.getHours();
      const minute = date.getMinutes();
      const timeInMinutes = hour * 60 + minute;
      
      // Weekend (Saturday = 6, Sunday = 0) - all times
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return true;
      }
      
      // Weekday evenings: 17:30 (1050 minutes) to 21:00 (1260 minutes)
      return timeInMinutes >= 1050 && timeInMinutes <= 1260;
    });
  };

  const groupSlotsByDay = (slots: AvailabilitySlot[]) => {
    const filteredSlots = filterNonWorkingHours(slots);
    const grouped: { [key: string]: AvailabilitySlot[] } = {};
    
    filteredSlots.forEach(slot => {
      const date = new Date(slot.dateTime);
      const dayKey = date.toLocaleDateString('en-GB', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(slot);
    });
    
    // Sort slots within each day by time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    });
    
    return grouped;
  };

  const groupedSlots = groupSlotsByDay(slots);

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Location not found</h1>
          <p className="text-gray-600 mb-4">
            Looking for: "{locationId}"<br/>
            Available: {Object.keys(locationConfig).join(', ')}
          </p>
          <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
            ← Back to locations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-700 font-medium mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to locations
          </Link>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              {location.name}
            </h1>
            <p className="text-xl text-gray-700 mb-2">
              {location.description}
            </p>
            <p className="text-green-700 font-medium">
              Available Court Times - Next 2 Weeks
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-600 mt-3">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <button
            onClick={fetchAvailability}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Checking Courts...
              </div>
            ) : (
              'Refresh Availability'
            )}
          </button>

          {/* Time Filter Toggle */}
          <div className="flex items-center bg-white rounded-full p-1 shadow-lg">
            <button
              onClick={() => setShowAfterWorkOnly(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                !showAfterWorkOnly
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Times
            </button>
            <button
              onClick={() => setShowAfterWorkOnly(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                showAfterWorkOnly
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Non-Working Hours
            </button>
          </div>
        </div>



        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-lg mb-8 max-w-2xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && slots.length === 0 ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-700 font-medium">Checking court availability...</p>
            <p className="text-gray-600 mt-2">This may take a moment</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            {slots.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{slots.length}</div>
                  <div className="text-gray-700 font-medium">Available Slots Found</div>
                </div>
              </div>
            )}

            {/* Available Slots */}
            <div className="space-y-8">
              {Object.entries(groupedSlots).map(([day, daySlots]) => (
                <div key={day} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-green-600 text-white px-6 py-4">
                    <h2 className="text-2xl font-bold flex items-center">
                      {day}
                      <span className="ml-auto text-sm bg-green-500 px-3 py-1 rounded-full">
                        {daySlots.length} slots
                      </span>
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {daySlots.map((slot, index) => (
                        <div
                          key={index}
                          className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center hover:bg-green-100 hover:border-green-300 transition-all duration-200 hover:shadow-md"
                        >
                          <div className="text-lg font-bold text-green-800 mb-1">
                            {new Date(slot.dateTime).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-sm text-green-600 font-medium mb-2">
                            {slot.locationName}
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-green-500 bg-green-200 px-2 py-1 rounded-full">
                              Available
                            </div>
                            <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full font-medium border border-blue-200">
                              £0.00
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              // TODO: Add booking URL here
                              console.log('Book slot:', slot);
                              alert('Booking URL will be added here');
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                          >
                            Book Now
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* No Slots Found */}
        {slots.length === 0 && !loading && !error && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4"></div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Available Slots</h3>
            <p className="text-gray-600 mb-6">All courts are currently booked for the next 2 weeks</p>
            <button
              onClick={fetchAvailability}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
            >
              Check Again
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            Built for The Triangle Leisure Centre padel enthusiasts
          </p>
        </div>
      </div>
    </div>
  );
}