'use client';

import Link from 'next/link';

interface Location {
    id: string;
    name: string;
    type: 'padel' | 'tennis';
    available: boolean;
    description: string;
    hasFloodLights?: boolean;
    price?: string;
}

const locations: Location[] = [
    {
        id: 'triangle-padel',
        name: 'Triangle Padel',
        type: 'padel',
        available: true,
        description: 'The Triangle Leisure Centre - Padel Courts',
        hasFloodLights: true,
        price: 'Membership'
    },
    {
        id: 'triangle-tennis',
        name: 'Triangle Tennis',
        type: 'tennis',
        available: true,
        description: 'The Triangle Leisure Centre - Tennis Courts',
        hasFloodLights: true,
        price: 'Membership'
    },
    {
        id: 'patcham-tennis',
        name: 'Patcham Tennis',
        type: 'tennis',
        available: true,
        description: 'Patcham Tennis Courts',
        hasFloodLights: false,
        price: '£9.30'
    },
    {
        id: 'hove-padel',
        name: 'Hove Padel',
        type: 'padel',
        available: false,
        description: 'Seafront Padel Courts',
        hasFloodLights: true,
        price: '£28.00'
    },
    {
        id: 'hove-tennis',
        name: 'Hove Tennis',
        type: 'tennis',
        available: true,
        description: 'Seafront Tennis Courts',
        hasFloodLights: true,
        price: '£8.90'
    },
    {
        id: 'archbishop-tennis',
        name: 'Archbishop Tennis',
        type: 'tennis',
        available: false,
        description: 'Archbishop Tennis Courts',
        hasFloodLights: false,
        price: '£10/hr'
    },
    {
        id: 'hyde-park-tennis',
        name: 'Hyde Park Tennis',
        type: 'tennis',
        available: false,
        description: 'Hyde Park Tennis Courts',
        hasFloodLights: false,
        price: '£9/hr'
    }
];

export default function LocationsPage() {


    const getTypeColor = (type: 'padel' | 'tennis') => {
        return type === 'padel'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-blue-100 text-blue-800 border-blue-200';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12" suppressHydrationWarning>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-3" suppressHydrationWarning>
                        Court Tracker
                    </h1>
                    <p className="text-xl text-gray-700 mb-2" suppressHydrationWarning>
                        Local Court Availability
                    </p>
                    <p className="text-green-700 font-medium" suppressHydrationWarning>
                        Select a location to view court availability
                    </p>
                </div>

                {/* Locations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.map((location) => (
                        <div key={location.id} className="relative">
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